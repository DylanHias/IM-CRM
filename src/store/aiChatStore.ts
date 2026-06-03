import { create } from 'zustand';
import { checkAvailability, pullModel, DEFAULT_MODEL } from '@/lib/ai/ollamaService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type OllamaStatus = 'unchecked' | 'checking' | 'available' | 'unavailable' | 'no-models' | 'pulling';

interface AiChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  ollamaStatus: OllamaStatus;
  isPulling: boolean;
  pullProgress: number;
  pullStatus: string;

  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateStreamingContent: (content: string) => void;
  finalizeStreaming: () => void;
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
  ollamaStatus: 'unchecked',
  isPulling: false,
  pullProgress: 0,
  pullStatus: '',

  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, { ...msg, id: newId(), timestamp: Date.now() }],
    })),

  updateStreamingContent: (streamingContent) => set({ streamingContent }),

  finalizeStreaming: () =>
    set((s) => {
      if (!s.streamingContent) return { isStreaming: false, streamingContent: '' };
      const msg: ChatMessage = {
        id: newId(),
        role: 'assistant',
        content: s.streamingContent,
        timestamp: Date.now(),
      };
      return { messages: [...s.messages, msg], isStreaming: false, streamingContent: '' };
    }),

  clearMessages: () => set({ messages: [], streamingContent: '', isStreaming: false }),

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
