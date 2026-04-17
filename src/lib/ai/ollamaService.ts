const OLLAMA_BASE = 'http://localhost:11434';

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

export async function checkAvailability(): Promise<{ available: boolean; models: string[] }> {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      console.error(`[ai] Ollama returned ${res.status} on /api/tags`);
      return { available: false, models: [] };
    }
    const data: OllamaTagsResponse = await res.json();
    return { available: true, models: data.models.map((m) => m.name) };
  } catch (err) {
    console.error('[ai] Ollama unavailable (is it running?):', err);
    return { available: false, models: [] };
  }
}

export async function streamChat(
  model: string,
  messages: OllamaMessage[],
  onChunk: (text: string) => void,
  onDone: () => void,
  signal?: AbortSignal
): Promise<void> {
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
