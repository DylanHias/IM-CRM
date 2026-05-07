import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LookupTableItem } from '@/types/lookupTable';
import { isTauriApp } from '@/lib/utils/offlineUtils';

interface LookupTableState {
  lookupTables: Record<string, LookupTableItem[]>;
  isLoaded: boolean;
  setAll: (data: Record<string, LookupTableItem[]>) => void;
  hydrateFromDb: () => Promise<void>;
}

export const useLookupTableStore = create<LookupTableState>()(
  persist(
    (set) => ({
      lookupTables: {},
      isLoaded: false,
      setAll: (data) => set({ lookupTables: data, isLoaded: true }),
      hydrateFromDb: async () => {
        if (!isTauriApp()) return;
        try {
          const { queryAllLookupTables } = await import('@/lib/db/queries/lookupTables');
          const data = await queryAllLookupTables();
          set({ lookupTables: data, isLoaded: true });
        } catch (err) {
          console.error('[settings] Failed to hydrate lookup tables:', err);
        }
      },
    }),
    {
      name: 'crm-lookup-tables',
      partialize: (state) => ({
        lookupTables: state.lookupTables,
        isLoaded: state.isLoaded,
      }),
    },
  ),
);
