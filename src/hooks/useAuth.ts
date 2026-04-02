'use client';

import { useEffect, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { useAuthStore } from '@/store/authStore';
import { loginRequest } from '@/lib/auth/msalConfig';
import { isTauriApp } from '@/lib/utils/offlineUtils';

export function useAuth() {
  const { instance, accounts, inProgress } = useMsal();
  const { setAccount, clearAuth, setIsAdmin, isAuthenticated, account } = useAuthStore();
  const restoredRef = useRef(false);

  useEffect(() => {
    if (inProgress !== 'none') return;

    // In Tauri, auth is handled by the custom OAuth server — skip MSAL token acquisition
    // entirely to prevent stale MSAL cache entries from triggering clearAuth()
    if (isTauriApp()) {
      if (!isAuthenticated && !restoredRef.current) {
        restoredRef.current = true;
        const tryRestore = async () => {
          try {
            const { restoreSession } = await import('@/lib/auth/authHelpers');
            const restored = await restoreSession();
            if (restored) {
              const restoredAccount = useAuthStore.getState().account;
              if (restoredAccount) await syncUserToDb(restoredAccount, setIsAdmin);
            } else {
              clearAuth();
            }
          } catch (err) {
            console.error('[auth] Session restore failed:', err);
            clearAuth();
          }
        };
        tryRestore();
      }
      return;
    }

    if (accounts.length > 0) {
      // MSAL has cached accounts (browser flow) — acquire token silently
      const acquireToken = async () => {
        try {
          const result = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
          setAccount(accounts[0], result.accessToken);
          await syncUserToDb(accounts[0], setIsAdmin);
        } catch (err) {
          console.error('[auth] Silent token acquisition failed:', err);
          clearAuth();
        }
      };
      acquireToken();
    } else if (!isAuthenticated && !restoredRef.current) {
      restoredRef.current = true;
      clearAuth();
    }
  }, [accounts, inProgress, instance, setAccount, clearAuth, setIsAdmin, isAuthenticated]);

  return { isAuthenticated, account, inProgress };
}

async function syncUserToDb(
  account: { localAccountId?: string; username?: string; name?: string },
  setIsAdmin: (isAdmin: boolean) => void,
): Promise<void> {
  if (!isTauriApp() || !account.localAccountId) return;
  try {
    const { upsertUser, isUserAdmin } = await import('@/lib/db/queries/users');
    const now = new Date().toISOString();
    const email = account.username ?? '';
    const role = email.toLowerCase() === 'dylan.hias@ingrammicro.com' ? 'admin' : 'user';
    await upsertUser({
      id: account.localAccountId,
      email,
      name: account.name ?? 'Unknown',
      role,
      businessUnit: null,
      title: null,
      lastActiveAt: now,
      createdAt: now,
      updatedAt: now,
    });
    const admin = await isUserAdmin(account.localAccountId);
    setIsAdmin(admin);
  } catch (dbErr) {
    console.error('[auth] DB user sync failed (staying authenticated):', dbErr);
  }
}
