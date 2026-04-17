import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { checkAvailability, pullModel, DEFAULT_MODEL } from '@/lib/ai/ollamaService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type OllamaStatus = 'unchecked' | 'checking' | 'available' | 'unavailable' | 'no-models' | 'pulling';

interface AiChatState {
  // Ephemeral — not persisted
  isOpen: boolean;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  ollamaStatus: OllamaStatus;
  availableModels: string[];
  isPulling: boolean;
  pullProgress: number;
  pullStatus: string;

  // Persisted
  selectedModel: string;

  // Actions
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateStreamingContent: (content: string) => void;
  finalizeStreaming: () => void;
  clearMessages: () => void;
  setStreaming: (streaming: boolean) => void;
  setSelectedModel: (model: string) => void;
  checkOllamaAvailability: () => Promise<void>;
}

export const useAiChatStore = create<AiChatState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      messages: [],
      isStreaming: false,
      streamingContent: '',
      ollamaStatus: 'unchecked',
      availableModels: [],
      isPulling: false,
      pullProgress: 0,
      pullStatus: '',
      selectedModel: '',

      setOpen: (isOpen) => set({ isOpen }),
      toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),

      addMessage: (msg) =>
        set((s) => ({
          messages: [
            ...s.messages,
            { ...msg, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, timestamp: Date.now() },
          ],
        })),

      updateStreamingContent: (streamingContent) => set({ streamingContent }),

      finalizeStreaming: () =>
        set((s) => {
          if (!s.streamingContent) return { isStreaming: false, streamingContent: '' };
          const msg: ChatMessage = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            role: 'assistant',
            content: s.streamingContent,
            timestamp: Date.now(),
          };
          return { messages: [...s.messages, msg], isStreaming: false, streamingContent: '' };
        }),

      clearMessages: () => set({ messages: [], streamingContent: '', isStreaming: false }),

      setStreaming: (isStreaming) => set({ isStreaming }),

      setSelectedModel: (selectedModel) => set({ selectedModel }),

      checkOllamaAvailability: async () => {
        set({ ollamaStatus: 'checking' });
        const { available, models } = await checkAvailability();
        if (!available) {
          set({ ollamaStatus: 'unavailable', availableModels: [] });
          return;
        }
        if (models.length === 0) {
          // Auto-pull the default model — no user interaction needed
          set({ ollamaStatus: 'pulling', isPulling: true, pullProgress: 0, pullStatus: 'Starting download…' });
          try {
            await pullModel(
              DEFAULT_MODEL,
              (percent, status) => set({ pullProgress: percent, pullStatus: status }),
              () => { /* handled below */ }
            );
          } catch (err) {
            console.error('[ai] auto-pull failed:', err);
            set({ ollamaStatus: 'unavailable', isPulling: false });
            return;
          }
          // Re-check after pull completes
          const after = await checkAvailability();
          if (!after.available || after.models.length === 0) {
            set({ ollamaStatus: 'unavailable', isPulling: false });
            return;
          }
          const current = get().selectedModel;
          const selectedModel = after.models.includes(current) ? current : after.models[0];
          set({ ollamaStatus: 'available', availableModels: after.models, selectedModel, isPulling: false, pullProgress: 0, pullStatus: '' });
          return;
        }
        const current = get().selectedModel;
        const selectedModel = models.includes(current) ? current : models[0];
        set({ ollamaStatus: 'available', availableModels: models, selectedModel });
      },
    }),
    {
      name: 'crm-ai-chat-store',
      partialize: (state) => ({ selectedModel: state.selectedModel }),
    }
  )
);
