import { isTauriApp } from '@/lib/utils/offlineUtils';
import { AI_TOOLS, executeTool, type OllamaTool } from './tools';

const OLLAMA_BASE = 'http://localhost:11434';
export const DEFAULT_MODEL = 'llama3.2:1b-instruct-q6_K';

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
  if (isTauriApp()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('kill_ollama');
    } catch (err) {
      console.error('[ai] kill_ollama invoke error:', err);
    }
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

/**
 * Boot warm-up: spawn the Ollama server in the background so the chat is ready
 * instantly when the user opens the page. Does NOT pull the model (that happens
 * lazily on first page visit). Never throws — failures are logged only.
 */
export async function warmUp(): Promise<void> {
  if (!isTauriApp()) return;
  try {
    await checkAvailability();
  } catch (err) {
    console.error('[ai] warm-up failed:', err);
  }
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

// ─── Streamed tool-calling chat ────────────────────────────────────────────
// The model streams its answer token-by-token (fast first token). If it instead
// asks to call a tool, the tool_calls arrive over the same stream; we run the
// read-only DB tool locally and stream the next round with the results appended.
// onChunk fires for every content token across all rounds; onDone fires once.

const MAX_TOOL_ROUNDS = 4;

interface ToolCall {
  function: { name: string; arguments: Record<string, unknown> | string };
}

type ChatTurn =
  | OllamaMessage
  | { role: 'assistant'; content: string; tool_calls: ToolCall[] }
  | { role: 'tool'; content: string };

const KNOWN_TOOL_NAMES = new Set(AI_TOOLS.map((t) => t.function.name));

/** Extract the first balanced { … } object from a string, ignoring trailing prose. */
function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return text.slice(start, i + 1);
  }
  return null;
}

/**
 * Small models (llama3.2:1b) sometimes print a tool call as plain text instead
 * of emitting a structured tool_calls array. Detect that shape and convert it
 * into a real ToolCall so we can execute it rather than show raw JSON.
 */
export function parseTextToolCall(raw: string): ToolCall | null {
  let text = raw.trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) text = fence[1].trim();
  const json = extractFirstJsonObject(text);
  if (!json) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  // Tolerate both the bare shape ({name, parameters}) and the full tool-schema
  // shape ({type, function: {name, parameters}}) that small models sometimes echo.
  const top = parsed as Record<string, unknown>;
  const fn =
    top.function && typeof top.function === 'object'
      ? (top.function as Record<string, unknown>)
      : top;
  const name = fn.name;
  if (typeof name !== 'string' || !KNOWN_TOOL_NAMES.has(name)) return null;
  const args = (fn.parameters ?? fn.arguments ?? {}) as Record<string, unknown> | string;
  return { function: { name, arguments: args } };
}

/**
 * Wraps onChunk so genuine prose streams immediately, but content that looks
 * like it might be a text-encoded tool call (starts with `{` or a code fence)
 * is held back until the round ends, then either extracted as a tool call or
 * flushed as-is. Prose never starts with `{`, so streaming UX is unaffected.
 */
function createToolCallGuard(onChunk: (text: string) => void) {
  let buffer = '';
  let passthrough = false;

  return {
    onChunk(text: string) {
      if (passthrough) {
        onChunk(text);
        return;
      }
      buffer += text;
      const trimmed = buffer.trimStart();
      if (trimmed === '') return;
      if (trimmed[0] !== '{' && !trimmed.startsWith('```')) {
        passthrough = true;
        onChunk(buffer);
        buffer = '';
      }
    },
    /** Returns a tool call if the buffer was one; otherwise flushes it as prose. */
    extractOrFlush(): ToolCall | null {
      if (passthrough || buffer === '') return null;
      const call = parseTextToolCall(buffer);
      if (call) {
        buffer = '';
        return call;
      }
      onChunk(buffer);
      buffer = '';
      return null;
    },
  };
}

/**
 * One streaming /api/chat round. Forwards content tokens via onChunk and returns
 * any tool calls the model requested. Does NOT signal completion — the caller
 * decides whether to run the tools and continue, or finish.
 */
async function streamRound(
  model: string,
  messages: ChatTurn[],
  tools: OllamaTool[] | undefined,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<ToolCall[]> {
  const collected: ToolCall[] = [];

  if (isTauriApp()) {
    // Tauri: stream via Channel — passed directly into the command, no race condition
    const { invoke, Channel } = await import('@tauri-apps/api/core');

    type ChunkEvent =
      | { event: 'chunk'; data: { content: string } }
      | { event: 'toolCalls'; data: { calls: ToolCall[] } }
      | { event: 'done' };

    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) { resolve(); return; }

      const channel = new Channel<ChunkEvent>();
      channel.onmessage = (msg) => {
        if (signal?.aborted) { resolve(); return; }
        if (msg.event === 'chunk') onChunk(msg.data.content);
        else if (msg.event === 'toolCalls') collected.push(...msg.data.calls);
        else if (msg.event === 'done') resolve();
      };

      signal?.addEventListener('abort', () => resolve());

      invoke('ollama_chat_stream', { model, messages, tools: tools ?? null, onChunk: channel })
        .catch(reject);
    });
    return collected;
  }

  // Browser/dev: native fetch with NDJSON streaming
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, tools, stream: true }),
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
          const chunk = JSON.parse(line) as {
            message?: { content?: string; tool_calls?: ToolCall[] };
            done: boolean;
          };
          if (chunk.message?.content) onChunk(chunk.message.content);
          if (chunk.message?.tool_calls?.length) collected.push(...chunk.message.tool_calls);
          if (chunk.done) return collected;
        } catch {
          // partial JSON line — skip
        }
      }
    }
    return collected;
  } finally {
    reader.releaseLock();
  }
}

export async function chatWithTools(
  model: string,
  messages: OllamaMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
  const working: ChatTurn[] = [...messages];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    if (signal?.aborted) { onDone(); return; }

    const guard = createToolCallGuard(onChunk);
    const structuredCalls = await streamRound(model, working, AI_TOOLS, guard.onChunk, signal);

    // Prefer structured tool calls; otherwise recover a text-encoded one.
    const toolCalls =
      structuredCalls.length > 0 ? structuredCalls : [guard.extractOrFlush()].filter(Boolean) as ToolCall[];

    // No tool calls means this round streamed the final answer.
    if (toolCalls.length === 0 || signal?.aborted) {
      onDone();
      return;
    }

    // Record the tool request, run each tool, feed results back, and loop.
    working.push({ role: 'assistant', content: '', tool_calls: toolCalls });
    for (const call of toolCalls) {
      const out = await executeTool(call.function?.name, call.function?.arguments);
      working.push({ role: 'tool', content: out });
    }
  }

  // Tool budget exhausted — one final streamed round without tools to force an answer.
  if (signal?.aborted) { onDone(); return; }
  await streamRound(model, working, undefined, onChunk, signal);
  onDone();
}
