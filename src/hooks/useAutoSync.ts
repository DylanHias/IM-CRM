'use client';

import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useSync } from './useSync';
import { toast } from 'sonner';
import { useSyncStore } from '@/store/syncStore';

let didAutoSync = false;

export function useAutoSync() {
  const { triggerSync, isOnline } = useSync();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const autoSyncOnLaunch = useSettingsStore((s) => s.autoSyncOnLaunch);
  const syncIntervalMinutes = useSettingsStore((s) => s.syncIntervalMinutes);
  const showSyncToasts = useSettingsStore((s) => s.showSyncToasts);

  // Auto-sync on launch (once)
  useEffect(() => {
    if (didAutoSync || !autoSyncOnLaunch || !isOnline) return;
    // Skip if InitialSyncDialog is handling the first sync
    if (useSyncStore.getState().initialSyncProgress !== null) return;
    didAutoSync = true;

    const run = async () => {
      try {
        await triggerSync();
        const errors = useSyncStore.getState().syncErrors;
        if (!showSyncToasts) return;
        if (errors.length > 0) {
          toast.error('Sync completed with errors', { description: `${errors.length} error(s) occurred` });
        } else {
          toast.success('Sync complete');
        }
      } catch (err) {
        console.error('[sync] Auto-sync failed:', err);
        toast.error('Sync failed', { description: 'Something went wrong — try again later' });
      }
    };
    run();
  }, [autoSyncOnLaunch, isOnline, triggerSync, showSyncToasts]);

  // Periodic sync interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const ms = syncIntervalMinutes * 60_000;
    intervalRef.current = setInterval(async () => {
      if (useSyncStore.getState().isSyncing) return;
      try {
        await triggerSync();
        const showToasts = useSettingsStore.getState().showSyncToasts;
        if (!showToasts) return;
        const errors = useSyncStore.getState().syncErrors;
        if (errors.length > 0) {
          toast.error('Background sync had errors');
        } else {
          toast.success('Background sync complete');
        }
      } catch (err) {
        console.error('[sync] Background sync failed:', err);
        toast.error('Background sync failed', { description: 'Will retry at next interval' });
      }
    }, ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [syncIntervalMinutes, triggerSync]);
}
