'use client';

import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useSync } from './useSync';
import { useSyncStore } from '@/store/syncStore';
import { syncPowerBiArr } from '@/lib/sync/syncService';
import { deleteSyncRecordsOlderThan } from '@/lib/db/queries/sync';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { notify } from '@/lib/notify';

let didAutoSync = false;
let didCleanupHistory = false;
let consecutiveFullSyncFailures = 0;
let consecutivePushPendingFailures = 0;

function shouldShowSyncToast(severity: 'success' | 'error'): boolean {
  const { showSyncToasts, syncToastVerbosity } = useSettingsStore.getState();
  if (!showSyncToasts) return false;
  if (syncToastVerbosity === 'silent') return false;
  if (syncToastVerbosity === 'errors') return severity === 'error';
  return true;
}

function shouldNotifyFailure(consecutive: number): boolean {
  const threshold = Math.max(1, useSettingsStore.getState().syncFailureNotificationThreshold);
  return consecutive >= threshold;
}

export function useAutoSync() {
  const { triggerSync, triggerPushPending, isOnline } = useSync();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const powerBiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const autoSyncOnLaunch = useSettingsStore((s) => s.autoSyncOnLaunch);
  const syncPaused = useSettingsStore((s) => s.syncPaused);
  const syncOnWindowFocus = useSettingsStore((s) => s.syncOnWindowFocus);
  const syncIntervalMinutes = useSettingsStore((s) => s.syncIntervalMinutes);
  const syncPendingIntervalMinutes = useSettingsStore((s) => s.syncPendingIntervalMinutes);
  const powerBiRefreshIntervalMinutes = useSettingsStore((s) => s.powerBiRefreshIntervalMinutes);
  const syncHistoryRetentionDays = useSettingsStore((s) => s.syncHistoryRetentionDays);

  useEffect(() => {
    if (didCleanupHistory || !isTauriApp()) return;
    didCleanupHistory = true;
    const days = useSettingsStore.getState().syncHistoryRetentionDays;
    deleteSyncRecordsOlderThan(days)
      .then((removed) => {
        if (removed > 0) console.log(`[sync] Pruned ${removed} sync_records older than ${days} days`);
      })
      .catch((err) => console.error('[sync] sync_records cleanup failed:', err));
  }, [syncHistoryRetentionDays]);

  useEffect(() => {
    if (didAutoSync || !autoSyncOnLaunch || !isOnline || syncPaused) return;
    if (useSyncStore.getState().initialSyncProgress !== null) return;
    didAutoSync = true;

    const run = async () => {
      try {
        await triggerSync();
        const errors = useSyncStore.getState().syncErrors;
        if (errors.length > 0) {
          consecutiveFullSyncFailures += 1;
          if (shouldNotifyFailure(consecutiveFullSyncFailures) && shouldShowSyncToast('error')) {
            notify('Sync completed with errors', {
              description: `${errors.length} error(s) occurred`,
              severity: 'error',
              critical: true,
            });
          }
        } else {
          consecutiveFullSyncFailures = 0;
          if (shouldShowSyncToast('success')) notify('Sync complete', { severity: 'success' });
        }
      } catch (err) {
        console.error('[sync] Auto-sync failed:', err);
        consecutiveFullSyncFailures += 1;
        if (shouldNotifyFailure(consecutiveFullSyncFailures) && shouldShowSyncToast('error')) {
          notify('Sync failed', {
            description: 'Something went wrong — try again later',
            severity: 'error',
            critical: true,
          });
        }
      }
    };
    run();
  }, [autoSyncOnLaunch, isOnline, syncPaused, triggerSync]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (syncPaused) return;

    const ms = syncIntervalMinutes * 60_000;
    intervalRef.current = setInterval(async () => {
      if (useSettingsStore.getState().syncPaused) return;
      if (useSyncStore.getState().isSyncing) return;
      try {
        await triggerSync();
        const errors = useSyncStore.getState().syncErrors;
        if (errors.length > 0) {
          consecutiveFullSyncFailures += 1;
          if (shouldNotifyFailure(consecutiveFullSyncFailures) && shouldShowSyncToast('error')) {
            notify('Background sync had errors', { severity: 'error', critical: true });
          }
        } else {
          consecutiveFullSyncFailures = 0;
          if (shouldShowSyncToast('success')) notify('Background sync complete', { severity: 'success' });
        }
      } catch (err) {
        console.error('[sync] Background sync failed:', err);
        consecutiveFullSyncFailures += 1;
        if (shouldNotifyFailure(consecutiveFullSyncFailures) && shouldShowSyncToast('error')) {
          notify('Background sync failed', {
            description: 'Will retry at next interval',
            severity: 'error',
            critical: true,
          });
        }
      }
    }, ms);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [syncIntervalMinutes, syncPaused, triggerSync]);

  useEffect(() => {
    if (pendingIntervalRef.current) {
      clearInterval(pendingIntervalRef.current);
      pendingIntervalRef.current = null;
    }
    if (syncPaused) return;

    const ms = syncPendingIntervalMinutes * 60_000;
    pendingIntervalRef.current = setInterval(async () => {
      if (useSettingsStore.getState().syncPaused) return;
      if (!useSettingsStore.getState().syncScopePushPending) return;
      if (useSyncStore.getState().isSyncing) return;
      const { pendingActivityCount, pendingFollowUpCount, pendingOpportunityCount } = useSyncStore.getState();
      if (pendingActivityCount === 0 && pendingFollowUpCount === 0 && pendingOpportunityCount === 0) return;
      try {
        await triggerPushPending();
        consecutivePushPendingFailures = 0;
        if (shouldShowSyncToast('success')) notify('Pending changes synced', { severity: 'success' });
      } catch (err) {
        console.error('[sync] Push pending failed:', err);
        consecutivePushPendingFailures += 1;
        if (shouldNotifyFailure(consecutivePushPendingFailures) && shouldShowSyncToast('error')) {
          notify('Push pending failed', {
            description: 'Will retry at next interval',
            severity: 'error',
            critical: true,
          });
        }
      }
    }, ms);

    return () => {
      if (pendingIntervalRef.current) clearInterval(pendingIntervalRef.current);
    };
  }, [syncPendingIntervalMinutes, syncPaused, triggerPushPending]);

  useEffect(() => {
    if (powerBiIntervalRef.current) {
      clearInterval(powerBiIntervalRef.current);
      powerBiIntervalRef.current = null;
    }
    if (syncPaused) return;

    const ms = powerBiRefreshIntervalMinutes * 60_000;
    powerBiIntervalRef.current = setInterval(async () => {
      if (useSettingsStore.getState().syncPaused) return;
      if (!useSettingsStore.getState().syncScopePowerBi) return;
      if (useSyncStore.getState().isSyncing) return;
      try {
        await syncPowerBiArr();
      } catch (err) {
        console.error('[sync] Power BI refresh failed:', err);
      }
    }, ms);

    return () => {
      if (powerBiIntervalRef.current) clearInterval(powerBiIntervalRef.current);
    };
  }, [powerBiRefreshIntervalMinutes, syncPaused]);

  useEffect(() => {
    if (!syncOnWindowFocus) return;

    const FOCUS_DEBOUNCE_MS = 5 * 60_000;
    let lastFocusSync = 0;

    const handler = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (useSettingsStore.getState().syncPaused) return;
      if (!getOnlineSnapshot()) return;
      if (useSyncStore.getState().isSyncing) return;
      const now = Date.now();
      if (now - lastFocusSync < FOCUS_DEBOUNCE_MS) return;
      lastFocusSync = now;
      triggerSync().catch((err) => console.error('[sync] Focus sync failed:', err));
    };

    window.addEventListener('focus', handler);
    document.addEventListener('visibilitychange', handler);
    return () => {
      window.removeEventListener('focus', handler);
      document.removeEventListener('visibilitychange', handler);
    };
  }, [syncOnWindowFocus, triggerSync]);
}

function getOnlineSnapshot(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}
