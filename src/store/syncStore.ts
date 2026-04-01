import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SyncError, SyncRecord } from '@/types/sync';

interface SyncState {
  isSyncing: boolean;
  lastD365SyncAt: string | null;
  syncErrors: SyncError[];
  recentRecords: SyncRecord[];
  pendingActivityCount: number;
  pendingFollowUpCount: number;

  setSyncing: (syncing: boolean) => void;
  setLastD365Sync: (at: string) => void;
  addSyncError: (error: SyncError) => void;
  clearSyncErrors: () => void;
  setRecentRecords: (records: SyncRecord[]) => void;
  setPendingCounts: (activities: number, followUps: number) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      isSyncing: false,
      lastD365SyncAt: null,
      syncErrors: [],
      recentRecords: [],
      pendingActivityCount: 0,
      pendingFollowUpCount: 0,

      setSyncing: (isSyncing) => set({ isSyncing }),
      setLastD365Sync: (at) => set({ lastD365SyncAt: at }),
      addSyncError: (error) => set((s) => ({ syncErrors: [error, ...s.syncErrors].slice(0, 50) })),
      clearSyncErrors: () => set({ syncErrors: [] }),
      setRecentRecords: (recentRecords) => set({ recentRecords }),
      setPendingCounts: (activities, followUps) =>
        set({ pendingActivityCount: activities, pendingFollowUpCount: followUps }),
    }),
    {
      name: 'crm-sync-store',
      partialize: (s) => ({
        lastD365SyncAt: s.lastD365SyncAt,
      }),
    }
  )
);
