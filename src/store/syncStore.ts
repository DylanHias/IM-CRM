import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SyncError, SyncRecord } from '@/types/sync';

interface SyncState {
  isSyncing: boolean;
  lastD365SyncAt: string | null;
  callerD365UserId: string | null;
  syncErrors: SyncError[];
  recentRecords: SyncRecord[];
  pendingActivityCount: number;
  pendingFollowUpCount: number;
  historyPage: number;
  initialSyncProgress: {
    phase: string;
    processed: number;
    total: number;
  } | null;

  setSyncing: (syncing: boolean) => void;
  setInitialSyncProgress: (progress: { phase: string; processed: number; total: number } | null) => void;
  setLastD365Sync: (at: string) => void;
  setCallerD365UserId: (id: string) => void;
  addSyncError: (error: SyncError) => void;
  clearSyncErrors: () => void;
  setRecentRecords: (records: SyncRecord[]) => void;
  setPendingCounts: (activities: number, followUps: number) => void;
  setHistoryPage: (page: number) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      isSyncing: false,
      lastD365SyncAt: null,
      callerD365UserId: null,
      syncErrors: [],
      recentRecords: [],
      pendingActivityCount: 0,
      pendingFollowUpCount: 0,
      historyPage: 1,
      initialSyncProgress: null,

      setSyncing: (isSyncing) => set({ isSyncing }),
      setLastD365Sync: (at) => set({ lastD365SyncAt: at }),
      setCallerD365UserId: (id) => set({ callerD365UserId: id }),
      addSyncError: (error) => set((s) => ({ syncErrors: [error, ...s.syncErrors].slice(0, 50) })),
      clearSyncErrors: () => set({ syncErrors: [] }),
      setRecentRecords: (recentRecords) => set({ recentRecords, historyPage: 1 }),
      setHistoryPage: (historyPage) => set({ historyPage }),
      setPendingCounts: (activities, followUps) =>
        set({ pendingActivityCount: activities, pendingFollowUpCount: followUps }),
      setInitialSyncProgress: (initialSyncProgress) => set({ initialSyncProgress }),
    }),
    {
      name: 'crm-sync-store',
      partialize: (s) => ({
        lastD365SyncAt: s.lastD365SyncAt,
        callerD365UserId: s.callerD365UserId,
      }),
    }
  )
);
