'use client';

import { useCallback } from 'react';
import { useSyncStore } from '@/store/syncStore';
import { runFullSync, pushPendingChanges, type SyncScope } from '@/lib/sync/syncService';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { d365Request } from '@/lib/auth/msalConfig';
import { useOnlineStatus } from './useOnlineStatus';

export function useSync() {
  const { isSyncing, lastD365SyncAt, syncErrors, pendingActivityCount, pendingFollowUpCount, pendingOpportunityCount } =
    useSyncStore();
  const isOnline = useOnlineStatus();

  // Stable identity: read volatile auth/online/syncing state at call time rather than
  // closing over subscribed values. Otherwise getToken — and triggerSync/triggerPushPending,
  // which depend on it — churned on every isSyncing flip, tearing down all auto-sync timers
  // and resetting the focus-sync debounce on each sync. (B7)
  const getToken = useCallback(async () => {
    const online = typeof navigator === 'undefined' ? true : navigator.onLine;
    if (!useAuthStore.getState().isAuthenticated || !online || useSyncStore.getState().isSyncing) {
      return null;
    }
    const token = await getAccessToken(d365Request.scopes);
    if (!token) console.warn('[useSync] No token available');
    return token;
  }, []);

  const triggerSync = useCallback(async (scope?: SyncScope) => {
    const token = await getToken();
    if (!token) return;
    const resolved = scope ?? {
      d365: useSettingsStore.getState().syncScopeD365,
      powerBi: useSettingsStore.getState().syncScopePowerBi,
      pushPending: useSettingsStore.getState().syncScopePushPending,
    };
    await runFullSync(token, resolved);
  }, [getToken]);

  const triggerPushPending = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    await pushPendingChanges(token);
  }, [getToken]);

  return {
    isSyncing,
    isOnline,
    lastD365SyncAt,
    syncErrors,
    pendingActivityCount,
    pendingFollowUpCount,
    pendingOpportunityCount,
    triggerSync,
    triggerPushPending,
  };
}
