'use client';

import { useCallback } from 'react';
import { useSyncStore } from '@/store/syncStore';
import { runFullSync } from '@/lib/sync/syncService';
import { useAuthStore } from '@/store/authStore';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { d365Request } from '@/lib/auth/msalConfig';
import { useOnlineStatus } from './useOnlineStatus';

export function useSync() {
  const { isSyncing, lastD365SyncAt, lastTrainingSyncAt, syncErrors, pendingActivityCount, pendingFollowUpCount } =
    useSyncStore();
  const { isAuthenticated } = useAuthStore();
  const isOnline = useOnlineStatus();

  const triggerSync = useCallback(async () => {
    if (!isAuthenticated || !isOnline || isSyncing) return;

    const token = await getAccessToken(d365Request.scopes);
    if (!token) {
      console.warn('[useSync] No token available');
      return;
    }

    await runFullSync(token);
  }, [isAuthenticated, isOnline, isSyncing]);

  return {
    isSyncing,
    isOnline,
    lastD365SyncAt,
    lastTrainingSyncAt,
    syncErrors,
    pendingActivityCount,
    pendingFollowUpCount,
    triggerSync,
  };
}
