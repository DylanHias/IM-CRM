import { isTauriApp } from '@/lib/utils/offlineUtils';

const OLLAMA_BASE = 'http://localhost:11434';
export const DEFAULT_MODEL = 'llama3.2:3b';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaModel {
  name: string;
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

interface OllamaPullChunk {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

/**
 * In Tauri: route through a Rust/reqwest invoke command to avoid Tauri HTTP
 * plugin resource management issues (invalid resource ID errors on Windows).
 * In browser/dev: use native fetch directly.
 */
async function ollamaGet(path: string): Promise<unknown> {
  if (isTauriApp()) {
    const { invoke } = await import('@tauri-apps/api/core');
    const text = await invoke<string>('ollama_request', { path, body: null });
    return JSON.parse(text);
  }
  const res = await fetch(`${OLLAMA_BASE}${path}`);
  if (!res.ok) throw new Error(`Ollama ${path} returned ${res.status}`);
  return res.json();
}

async function ollamaPost(path: string, payload: unknown): Promise<unknown> {
  if (isTauriApp()) {
    const { invoke } = await import('@tauri-apps/api/core');
    const text = await invoke<string>('ollama_request', { path, body: JSON.stringify(payload) });
    return JSON.parse(text);
  }
  const res = await fetch(`${OLLAMA_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Ollama ${path} returned ${res.status}`);
  return res.json();
}

async function pingOllama(): Promise<{ available: boolean; models: string[] }> {
  try {
    const data = await ollamaGet('/api/tags') as OllamaTagsResponse;
    return { available: true, models: data.models.map((m) => m.name) };
  } catch {
    return { available: false, models: [] };
  }
}

let ollamaChild: { kill: () => Promise<void> } | null = null;

async function spawnOllamaServe(): Promise<void> {
  if (!isTauriApp()) return;
  try {
    const { Command } = await import('@tauri-apps/plugin-shell');
    const command = Command.sidecar('binaries/ollama', ['serve'], {
      env: { OLLAMA_ORIGINS: 'http://tauri.localhost' },
    });
    ollamaChild = await command.spawn();
  } catch (err) {
    // Expected if already running or not yet bundled in dev
    console.error('[ai] ollama serve spawn error:', err);
  }
}

export async function stopOllamaServe(): Promise<void> {
  if (ollamaChild) {
    try {
      await ollamaChild.kill();
    } catch (err) {
      console.error('[ai] ollama kill error:', err);
    }
    ollamaChild = null;
  }
}

export async function checkAvailability(): Promise<{ available: boolean; models: string[] }> {
  const first = await pingOllama();
  if (first.available) return first;

  await spawnOllamaServe();

  for (let i = 0; i < 5; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const retry = await pingOllama();
    if (retry.available) return retry;
  }

  console.error('[ai] Ollama unavailable after auto-start attempt.');
  return { available: false, models: [] };
}

export async function pullModel(
  model: string,
  onProgress: (percent: number, status: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
  if (isTauriApp()) {
    return pullModelViaSidecar(model, onProgress, onDone, signal);
  }
  return pullModelViaHttp(model, onProgress, onDone, signal);
}

/**
 * Pull via `ollama pull` sidecar — avoids HTTP plugin resource-ID
 * invalidation that occurs during long (~2 GB) streaming downloads.
 */
async function pullModelViaSidecar(
  model: string,
  onProgress: (percent: number, status: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
  const { Command } = await import('@tauri-apps/plugin-shell');
  const command = Command.sidecar('binaries/ollama', ['pull', model]);

  command.stderr.on('data', (line: string) => {
    const percentMatch = line.match(/(\d+)%/);
    if (percentMatch) {
      onProgress(parseInt(percentMatch[1]), `pulling ${model}`);
    } else if (line.includes('pulling manifest')) {
      onProgress(0, 'pulling manifest');
    } else if (line.includes('verifying') || line.includes('writing manifest')) {
      onProgress(99, line.trim());
    }
  });

  const child = await command.spawn();

  signal?.addEventListener('abort', () => {
    child.kill().catch(() => {});
  });

  await new Promise<void>((resolve, reject) => {
    command.on('close', (data: { code: number | null }) => {
      if (data.code === 0 || data.code === null) {
        onDone();
        resolve();
      } else {
        reject(new Error(`ollama pull exited with code ${data.code}`));
      }
    });
    command.on('error', (err: string) => reject(new Error(err)));
  });
}

async function pullModelViaHttp(
  model: string,
  onProgress: (percent: number, status: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${OLLAMA_BASE}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: model, stream: true }),
    signal,
  });

  if (!res.ok) throw new Error(`Pull failed: ${res.status}`);
  if (!res.body) throw new Error('No response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        try {
          const chunk: OllamaPullChunk = JSON.parse(line);
          const percent =
            chunk.total && chunk.completed
              ? Math.round((chunk.completed / chunk.total) * 100)
              : 0;
          onProgress(percent, chunk.status);
          if (chunk.status === 'success') {
            onDone();
            return;
          }
        } catch {
          // partial line — skip
        }
      }
    }
    onDone();
  } finally {
    reader.releaseLock();
  }
}

export async function streamChat(
  model: string,
  messages: OllamaMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
  if (isTauriApp()) {
    // Tauri: stream via Channel — passed directly into the command, no race condition
    const { invoke, Channel } = await import('@tauri-apps/api/core');

    type ChunkEvent =
      | { event: 'chunk'; data: { content: string } }
      | { event: 'done' };

    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) { resolve(); return; }

      const channel = new Channel<ChunkEvent>();
      channel.onmessage = (msg) => {
        if (signal?.aborted) { resolve(); return; }
        if (msg.event === 'chunk') onChunk(msg.data.content);
        if (msg.event === 'done') { onDone(); resolve(); }
      };

      signal?.addEventListener('abort', () => resolve());

      invoke('ollama_chat_stream', { model, messages, onChunk: channel })
        .catch(reject);
    });
    return;
  }

  // Browser/dev: native fetch with NDJSON streaming
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
    signal,
  });

  if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
  if (!res.body) throw new Error('No response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line) as { message?: { content: string }; done: boolean };
          if (chunk.message?.content) onChunk(chunk.message.content);
          if (chunk.done) {
            onDone();
            return;
          }
        } catch {
          // partial JSON line — skip
        }
      }
    }
    onDone();
  } finally {
    reader.releaseLock();
  }
}
