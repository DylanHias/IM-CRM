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

interface OllamaChatChunk {
  message: { content: string };
  done: boolean;
}

interface OllamaPullChunk {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

/**
 * Use Tauri's HTTP plugin when running inside Tauri (requests go through Rust,
 * bypassing the webview's CORS restrictions). Fall back to native fetch in
 * browser / dev mode.
 */
async function tauriFetch(url: string, init?: RequestInit): Promise<Response> {
  if (isTauriApp()) {
    const { fetch: pluginFetch } = await import('@tauri-apps/plugin-http');
    return pluginFetch(url, init) as Promise<Response>;
  }
  return fetch(url, init);
}

async function pingOllama(): Promise<{ available: boolean; models: string[] }> {
  try {
    const res = await tauriFetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { available: false, models: [] };
    const data: OllamaTagsResponse = await res.json();
    return { available: true, models: data.models.map((m) => m.name) };
  } catch {
    return { available: false, models: [] };
  }
}

async function spawnOllamaServe(): Promise<void> {
  if (!isTauriApp()) return;
  try {
    const { Command } = await import('@tauri-apps/plugin-shell');
    // OLLAMA_ORIGINS allows the Tauri webview origin as a fallback for any
    // direct fetch calls that bypass the HTTP plugin.
    const command = Command.sidecar('binaries/ollama', ['serve'], {
      env: { OLLAMA_ORIGINS: 'http://tauri.localhost' },
    });
    await command.spawn();
  } catch (err) {
    // Expected if already running or not yet bundled in dev
    console.error('[ai] ollama serve spawn error:', err);
  }
}

export async function checkAvailability(): Promise<{ available: boolean; models: string[] }> {
  const first = await pingOllama();
  if (first.available) return first;

  // Not running — try to start the bundled sidecar silently
  await spawnOllamaServe();

  // Poll up to 5s until it responds
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
 * Pull via `ollama pull` sidecar — avoids Tauri HTTP plugin resource-ID
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

  // ollama pull writes human-readable progress to stderr
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
  const res = await tauriFetch(`${OLLAMA_BASE}/api/pull`, {
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
    return chatViaNonStreaming(model, messages, onChunk, onDone, signal);
  }
  return chatViaStreaming(model, messages, onChunk, onDone, signal);
}

/**
 * Tauri's HTTP plugin buffers the full response before yielding chunks,
 * so streaming endpoints hang indefinitely. Use stream:false and get one response.
 */
async function chatViaNonStreaming(
  model: string,
  messages: OllamaMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await tauriFetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false }),
    signal,
  });

  if (!res.ok) throw new Error(`Ollama returned ${res.status}`);

  const data: { message: { content: string } } = await res.json();
  if (data.message?.content) onChunk(data.message.content);
  onDone();
}

async function chatViaStreaming(
  model: string,
  messages: OllamaMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await tauriFetch(`${OLLAMA_BASE}/api/chat`, {
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
          const chunk: OllamaChatChunk = JSON.parse(line);
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
