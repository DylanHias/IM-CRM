import { create } from 'zustand';
import { checkAvailability, pullModel, DEFAULT_MODEL } from '@/lib/ai/ollamaService';
import type { ChatTurn, ToolInvocation } from '@/lib/ai/ollamaService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** Raw tool-call/tool-result turns that produced this answer; replayed for follow-up context. */
  toolTurns?: ChatTurn[];
  /** Data lookups performed for this answer, shown as transparency chips. */
  tools?: ToolInvocation[];
}

export interface StreamMeta {
  toolTurns?: ChatTurn[];
  tools?: ToolInvocation[];
}

export type OllamaStatus = 'unchecked' | 'checking' | 'available' | 'unavailable' | 'no-models' | 'pulling';

interface AiChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  toolStatus: string | null;
  ollamaStatus: OllamaStatus;
  isPulling: boolean;
  pullProgress: number;
  pullStatus: string;

  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateStreamingContent: (content: string) => void;
  setToolStatus: (status: string | null) => void;
  finalizeStreaming: (meta?: StreamMeta) => void;
  clearMessages: () => void;
  setStreaming: (streaming: boolean) => void;
  checkOllamaAvailability: () => Promise<void>;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function ensureDefaultModel(
  models: string[],
  onProgress: (percent: number, status: string) => void
): Promise<string[]> {
  if (models.includes(DEFAULT_MODEL)) return models;
  await pullModel(DEFAULT_MODEL, onProgress, () => {});
  const after = await checkAvailability();
  return after.models;
}

export const useAiChatStore = create<AiChatState>()((set) => ({
  messages: [],
  isStreaming: false,
  streamingContent: '',
  toolStatus: null,
  ollamaStatus: 'unchecked',
  isPulling: false,
  pullProgress: 0,
  pullStatus: '',

  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, { ...msg, id: newId(), timestamp: Date.now() }],
    })),

  updateStreamingContent: (streamingContent) => set({ streamingContent }),

  setToolStatus: (toolStatus) => set({ toolStatus }),

  finalizeStreaming: (meta) =>
    set((s) => {
      if (!s.streamingContent) return { isStreaming: false, streamingContent: '', toolStatus: null };
      const msg: ChatMessage = {
        id: newId(),
        role: 'assistant',
        content: s.streamingContent,
        timestamp: Date.now(),
        toolTurns: meta?.toolTurns,
        tools: meta?.tools,
      };
      return { messages: [...s.messages, msg], isStreaming: false, streamingContent: '', toolStatus: null };
    }),

  clearMessages: () => set({ messages: [], streamingContent: '', isStreaming: false, toolStatus: null }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  checkOllamaAvailability: async () => {
    set({ ollamaStatus: 'checking' });
    const { available, models } = await checkAvailability();
    if (!available) {
      set({ ollamaStatus: 'unavailable' });
      return;
    }
    if (!models.includes(DEFAULT_MODEL)) {
      set({ ollamaStatus: 'pulling', isPulling: true, pullProgress: 0, pullStatus: 'Starting download…' });
      try {
        await ensureDefaultModel(
          models,
          (percent, status) => set({ pullProgress: percent, pullStatus: status })
        );
      } catch (err) {
        console.error('[ai] auto-pull failed:', err);
        set({ ollamaStatus: 'unavailable', isPulling: false });
        return;
      }
    }
    set({ ollamaStatus: 'available', isPulling: false, pullProgress: 0, pullStatus: '' });
  },
}));
