'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';

/**
 * Resolves the current user's D365 system user ID from the users table.
 * MSAL `localAccountId` (Azure AD OID) differs from D365 `systemuserid`.
 * D365-synced records use the D365 ID as `created_by_id`, so we need it
 * for queries that filter by user (follow-ups page, overdue badge).
 */
export function useD365UserId(): string | null {
  const account = useAuthStore((s) => s.account);
  const lastD365SyncAt = useSyncStore((s) => s.lastD365SyncAt);
  const [d365UserId, setD365UserId] = useState<string | null>(null);

  useEffect(() => {
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
  }, [account?.username, lastD365SyncAt]);

  return d365UserId;
}
