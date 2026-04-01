import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OptionSetItem } from '@/types/optionSet';
import { isTauriApp } from '@/lib/utils/offlineUtils';

interface OptionSetState {
  optionSets: Record<string, OptionSetItem[]>;
  isLoaded: boolean;
  setOptionSet: (key: string, options: OptionSetItem[]) => void;
  setAll: (data: Record<string, OptionSetItem[]>) => void;
  hydrateFromDb: () => Promise<void>;
}

export const useOptionSetStore = create<OptionSetState>()(
  persist(
    (set) => ({
      optionSets: {},
      isLoaded: false,

      setOptionSet: (key, options) =>
        set((state) => ({
          optionSets: { ...state.optionSets, [key]: options },
        })),

      setAll: (data) => set({ optionSets: data, isLoaded: true }),

      hydrateFromDb: async () => {
        if (!isTauriApp()) return;
        try {
          const { queryAllOptionSets } = await import('@/lib/db/queries/optionSets');
          const data = await queryAllOptionSets();
          set({ optionSets: data, isLoaded: true });
        } catch (err) {
          console.error('[settings] Failed to hydrate option sets:', err);
        }
      },
    }),
    {
      name: 'crm-option-sets',
      partialize: (state) => ({
        optionSets: state.optionSets,
        isLoaded: state.isLoaded,
      }),
    },
  ),
);
