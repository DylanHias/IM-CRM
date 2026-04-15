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
export function useD365UserId(): string | null {
  const account = useAuthStore((s) => s.account);
  const lastD365SyncAt = useSyncStore((s) => s.lastD365SyncAt);
  const callerD365UserId = useSyncStore((s) => s.callerD365UserId);
  const [d365UserId, setD365UserId] = useState<string | null>(null);

  useEffect(() => {
    // Use the D365 system GUID persisted from WhoAmI during sync when available.
    // This is the correct ID that matches `created_by_id` on D365-synced records.
    if (callerD365UserId) {
      setD365UserId(callerD365UserId);
      return;
    }

    if (!account?.username || !isTauriApp()) {
      setD365UserId(null);
      return;
    }

    const resolve = async () => {
      try {
        const { queryD365UserIdByEmail } = await import('@/lib/db/queries/users');
        const id = await queryD365UserIdByEmail(account.username);
        setD365UserId(id);
      } catch (err) {
        console.error('[auth] Failed to resolve D365 user ID:', err);
        setD365UserId(null);
      }
    };
    resolve();
  }, [account?.username, lastD365SyncAt, callerD365UserId]);

  return d365UserId;
}
