import { isTauriApp } from '@/lib/utils/offlineUtils';
import { AI_TOOLS, executeTool, type OllamaTool } from './tools';

const OLLAMA_BASE = 'http://localhost:11434';
// Must be a tool-capable model (Ollama capability "tools"). deepseek-r1 distills
// are "thinking"-only and silently ignore tool calls, so Iris could never read the
// CRM. llama3.2:1b had tools but was too weak to follow grounding/scope rules — it
// invented UI, fabricated contacts, and answered off-topic prompts. qwen2.5:3b is
// tool-capable AND a far stronger small instruction-follower, so it stays on-scope
// and grounds answers in the provided data/reference.
export const DEFAULT_MODEL = 'qwen2.5:3b-instruct-q4_K_M';

// Keep the model resident in RAM between messages so there's no multi-second cold
// reload after an idle pause (Ollama unloads after 5 min by default).
const KEEP_ALIVE = '30m';
// Cap the context window — the system prompt + trimmed help docs + MAX_HISTORY(12)
// fit well under 4k, and CPU prompt-processing cost scales with context size.
// num_predict bounds the worst-case reply length (and thus latency).
const CHAT_OPTIONS = { num_ctx: 4096, num_predict: 768 } as const;

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

/**
 * Warm the model weights into RAM (an empty /api/generate loads the model without
 * generating) and keep them resident, so the user's first real message streams
 * instantly instead of paying a cold load. Fire-and-forget; never throws.
 */
export async function preloadModel(model: string): Promise<void> {
  const body = JSON.stringify({ model, keep_alive: KEEP_ALIVE });
  try {
    if (isTauriApp()) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('ollama_request', { path: '/api/generate', body });
    } else {
      await fetch(`${OLLAMA_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    }
  } catch (err) {
    console.error('[ai] model preload failed:', err);
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

export interface ToolCall {
  function: { name: string; arguments: Record<string, unknown> | string };
}

export type ChatTurn =
  | OllamaMessage
  | { role: 'assistant'; content: string; tool_calls: ToolCall[] }
  | { role: 'tool'; content: string };

/** A data lookup the assistant performed, for live status + post-answer transparency chips. */
export interface ToolInvocation {
  /** Present-tense status shown live while the lookup runs (e.g. `Searching customers for "Dattico"…`). */
  running: string;
  /** Past-tense label shown as a chip on the finished answer (e.g. `Searched customers for "Dattico"`). */
  done: string;
}

/** What chatWithTools returns so the caller can persist the tool round-trip and show what was looked up. */
export interface ChatToolMeta {
  /** Assistant tool-call + tool-result turns produced this answer; replay them next turn for follow-up context. */
  toolTurns: ChatTurn[];
  /** Human-readable record of each lookup performed. */
  invocations: ToolInvocation[];
}

const TOOL_VERBS: Record<string, { running: string; done: string }> = {
  get_account_overview: { running: 'Looking up', done: 'Looked up' },
  search_customers: { running: 'Searching customers for', done: 'Searched customers for' },
  search_contacts: { running: 'Searching contacts for', done: 'Searched contacts for' },
  search_opportunities: { running: 'Searching deals for', done: 'Searched deals for' },
  get_revenue: { running: 'Looking up revenue for', done: 'Looked up revenue for' },
};

function describeInvocation(name: string, rawArgs: Record<string, unknown> | string): ToolInvocation {
  const q = typeof rawArgs === 'string' ? rawArgs : rawArgs?.query;
  const query = typeof q === 'string' ? q.trim() : '';
  const verb = TOOL_VERBS[name];
  if (!verb) return { running: `Using ${name}…`, done: `Used ${name}` };
  const suffix = query ? ` "${query}"` : '';
  return { running: `${verb.running}${suffix}…`, done: `${verb.done}${suffix}` };
}

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

/** Parse the first JSON object out of possibly fenced/trailing-prose text. */
function extractObject(raw: string): Record<string, unknown> | null {
  let text = raw.trim();
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) text = fence[1].trim();
  const json = extractFirstJsonObject(text);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Small models sometimes print a tool call as plain text instead of emitting a
 * structured tool_calls array. Detect that shape and convert it into a real
 * ToolCall so we can execute it rather than show raw JSON.
 */
export function parseTextToolCall(raw: string): ToolCall | null {
  const parsed = extractObject(raw);
  if (!parsed) return null;
  // Tolerate both the bare shape ({name, parameters}) and the full tool-schema
  // shape ({type, function: {name, parameters}}) that small models sometimes echo.
  const fn =
    parsed.function && typeof parsed.function === 'object'
      ? (parsed.function as Record<string, unknown>)
      : parsed;
  const name = fn.name;
  if (typeof name !== 'string' || !KNOWN_TOOL_NAMES.has(name)) return null;
  const args = (fn.parameters ?? fn.arguments ?? {}) as Record<string, unknown> | string;
  return { function: { name, arguments: args } };
}

/** True if the object looks like a tool call / tool schema the model echoed as text. */
function hasToolCallShape(obj: Record<string, unknown>): boolean {
  const fn =
    obj.function && typeof obj.function === 'object'
      ? (obj.function as Record<string, unknown>)
      : obj;
  return typeof fn.name === 'string' || 'parameters' in fn || 'arguments' in fn || obj.type === 'function';
}

/**
 * Decide what to do with held-back text that began with `{` or a code fence:
 * run it as a real tool call, silently suppress it when it's a hallucinated or
 * echoed tool-call shape (so raw JSON never reaches the user), or flush it as
 * genuine prose that merely happened to start with `{`.
 */
export function classifyTextToolCall(raw: string): { call: ToolCall | null; suppress: boolean } {
  const call = parseTextToolCall(raw);
  if (call) return { call, suppress: false };
  const obj = extractObject(raw);
  if (obj && hasToolCallShape(obj)) return { call: null, suppress: true };
  return { call: null, suppress: false };
}

/** Longest suffix of `buf` that is a proper prefix of `tag` (for split-tag detection). */
function partialTagSuffixLen(buf: string, tag: string): number {
  const max = Math.min(buf.length, tag.length - 1);
  for (let len = max; len > 0; len--) {
    if (tag.startsWith(buf.slice(buf.length - len))) return len;
  }
  return 0;
}

/**
 * Reasoning models (deepseek-r1) wrap their chain-of-thought in <think>…</think>
 * inline in the content stream. This strips those blocks so only the final answer
 * (and any text-encoded tool call after </think>) reaches the UI/tool-call guard.
 * Streaming-safe: tags split across chunk boundaries are held back until resolved.
 */
export function createThinkStripper(onChunk: (text: string) => void) {
  const OPEN = '<think>';
  const CLOSE = '</think>';
  let inThink = false;
  let buf = '';

  return {
    onChunk(text: string) {
      buf += text;
      while (buf.length > 0) {
        if (!inThink) {
          const idx = buf.indexOf(OPEN);
          if (idx !== -1) {
            if (idx > 0) onChunk(buf.slice(0, idx));
            buf = buf.slice(idx + OPEN.length);
            inThink = true;
            continue;
          }
          const keep = partialTagSuffixLen(buf, OPEN);
          if (buf.length > keep) onChunk(buf.slice(0, buf.length - keep));
          buf = buf.slice(buf.length - keep);
          break;
        }
        const idx = buf.indexOf(CLOSE);
        if (idx !== -1) {
          buf = buf.slice(idx + CLOSE.length);
          inThink = false;
          continue;
        }
        buf = buf.slice(buf.length - partialTagSuffixLen(buf, CLOSE));
        break;
      }
    },
    /** Emit any retained non-think tail once the stream ends. */
    flush() {
      if (!inThink && buf) onChunk(buf);
      buf = '';
    },
  };
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
  let emitted = false;

  return {
    onChunk(text: string) {
      if (passthrough) {
        if (text) emitted = true;
        onChunk(text);
        return;
      }
      buffer += text;
      const trimmed = buffer.trimStart();
      if (trimmed === '') return;
      if (trimmed[0] !== '{' && !trimmed.startsWith('```')) {
        passthrough = true;
        emitted = true;
        onChunk(buffer);
        buffer = '';
      }
    },
    /**
     * Resolve the held buffer: a real tool call to run, a suppressed hallucination
     * (raw tool-call JSON the model emitted instead of calling a tool — never shown
     * to the user), or genuine prose flushed as-is.
     */
    resolve(): { call: ToolCall | null; suppressed: boolean } {
      if (passthrough || buffer === '') return { call: null, suppressed: false };
      const held = buffer;
      buffer = '';
      const { call, suppress } = classifyTextToolCall(held);
      if (call) return { call, suppressed: false };
      if (suppress) return { call: null, suppressed: true };
      emitted = true;
      onChunk(held);
      return { call: null, suppressed: false };
    },
    /** Whether any genuine prose has reached the user through this guard. */
    get emitted() {
      return emitted;
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

      invoke('ollama_chat_stream', {
        model,
        messages,
        tools: tools ?? null,
        keepAlive: KEEP_ALIVE,
        options: CHAT_OPTIONS,
        onChunk: channel,
      }).catch(reject);
    });
    return collected;
  }

  // Browser/dev: native fetch with NDJSON streaming
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, tools, stream: true, keep_alive: KEEP_ALIVE, options: CHAT_OPTIONS }),
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
  messages: ChatTurn[],
  onChunk: (text: string) => void,
  signal?: AbortSignal,
  onToolStatus?: (status: string | null) => void
): Promise<ChatToolMeta> {
  const working: ChatTurn[] = [...messages];
  const startLen = working.length;
  const invocations: ToolInvocation[] = [];
  let emittedAnswer = false;

  // Everything appended past the input is the tool round-trip the caller persists.
  const meta = (): ChatToolMeta => ({ toolTurns: working.slice(startLen), invocations });

  // Shown when a round produced no answer the user could see — e.g. the model
  // emitted a hallucinated tool call (which we suppress) instead of replying.
  const fallback = () => {
    if (!emittedAnswer && !signal?.aborted) {
      onChunk("I'm not quite sure what you're after. I can help you find your way around the CRM, or look up your customers, contacts, deals, activities and revenue — what would you like to do?");
    }
  };

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    if (signal?.aborted) return meta();

    const guard = createToolCallGuard(onChunk);
    const stripper = createThinkStripper(guard.onChunk);
    const structuredCalls = await streamRound(model, working, AI_TOOLS, stripper.onChunk, signal);
    stripper.flush();

    // Prefer structured tool calls; otherwise recover (or suppress) a text-encoded one.
    let toolCalls = structuredCalls;
    if (structuredCalls.length === 0) {
      const { call } = guard.resolve();
      toolCalls = call ? [call] : [];
    }
    if (guard.emitted) emittedAnswer = true;

    // No tool calls means this round streamed the final answer (or a suppressed
    // hallucination, in which case the fallback covers the empty bubble).
    if (toolCalls.length === 0 || signal?.aborted) {
      fallback();
      return meta();
    }

    // Record the tool request, run each tool, feed results back, and loop.
    working.push({ role: 'assistant', content: '', tool_calls: toolCalls });
    for (const call of toolCalls) {
      const inv = describeInvocation(call.function?.name, call.function?.arguments ?? {});
      invocations.push(inv);
      onToolStatus?.(inv.running);
      const out = await executeTool(call.function?.name, call.function?.arguments);
      working.push({ role: 'tool', content: out });
    }
    // Leave the running label up — local DB lookups finish in milliseconds, so
    // clearing it here makes the status flash invisibly. It stays visible while
    // the model composes the answer and is cleared once content streams (the
    // `!content` status block hides) or by finalizeStreaming.
  }

  // Tool budget exhausted — one final streamed round without tools to force an answer.
  if (signal?.aborted) return meta();
  const finalGuard = createToolCallGuard(onChunk);
  const finalStripper = createThinkStripper(finalGuard.onChunk);
  await streamRound(model, working, undefined, finalStripper.onChunk, signal);
  finalStripper.flush();
  finalGuard.resolve();
  if (finalGuard.emitted) emittedAnswer = true;
  fallback();
  return meta();
}
