'use client';

import { useCallback } from 'react';
import { useSyncStore } from '@/store/syncStore';
import { runFullSync, pushPendingChanges } from '@/lib/sync/syncService';
import { useAuthStore } from '@/store/authStore';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { d365Request } from '@/lib/auth/msalConfig';
import { useOnlineStatus } from './useOnlineStatus';

export function useSync() {
  const { isSyncing, lastD365SyncAt, syncErrors, pendingActivityCount, pendingFollowUpCount } =
    useSyncStore();
  const { isAuthenticated } = useAuthStore();
  const isOnline = useOnlineStatus();

  const getToken = useCallback(async () => {
    if (!isAuthenticated || !isOnline || isSyncing) return null;
    const token = await getAccessToken(d365Request.scopes);
    if (!token) console.warn('[useSync] No token available');
    return token;
  }, [isAuthenticated, isOnline, isSyncing]);

  const triggerSync = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    await runFullSync(token);
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
    triggerSync,
    triggerPushPending,
  };
}
