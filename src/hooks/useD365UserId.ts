'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';

/**
 * Resolves the current user's D365 system user ID.
 * MSAL `localAccountId` (Azure AD OID) differs from D365 `systemuserid`.
 * D365-synced records use the D365 GUID as `created_by_id`, so we need it
 * for queries that filter by user (analytics, follow-ups page, overdue badge).
 *
 * Priority:
 * 1. `callerD365UserId` persisted in syncStore (set during D365 sync via WhoAmI)
 * 2. DB lookup by email (falls back to `localAccountId` before first sync)
 */
export interface ResolvedD365UserId {
  id: string | null;
  isResolved: boolean;
}

export function useD365UserIdResolved(): ResolvedD365UserId {
  const account = useAuthStore((s) => s.account);
  const lastD365SyncAt = useSyncStore((s) => s.lastD365SyncAt);
  const callerD365UserId = useSyncStore((s) => s.callerD365UserId);
  const [fallbackId, setFallbackId] = useState<string | null>(null);
  const [fallbackResolved, setFallbackResolved] = useState(false);

  useEffect(() => {
    if (callerD365UserId) {
      setFallbackResolved(true);
      return;
    }
    if (!account?.username || !isTauriApp()) {
      setFallbackResolved(true);
      return;
    }

    setFallbackResolved(false);
    const resolve = async () => {
      try {
        const { queryD365UserIdByEmail } = await import('@/lib/db/queries/users');
        const id = await queryD365UserIdByEmail(account.username);
        setFallbackId(id);
      } catch (err) {
        console.error('[auth] Failed to resolve D365 user ID:', err);
        setFallbackId(null);
      } finally {
        setFallbackResolved(true);
      }
    };
    resolve();
  }, [account?.username, lastD365SyncAt, callerD365UserId]);

  return {
    id: callerD365UserId ?? fallbackId,
    isResolved: !!callerD365UserId || fallbackResolved,
  };
}

export function useD365UserId(): string | null {
  return useD365UserIdResolved().id;
}
