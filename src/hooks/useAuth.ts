'use client';

import { useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useAuthStore } from '@/store/authStore';
import { loginRequest } from '@/lib/auth/msalConfig';
import { isTauriApp } from '@/lib/utils/offlineUtils';

export function useAuth() {
  const { instance, accounts, inProgress } = useMsal();
  const { setAccount, clearAuth, setLoading, setIsAdmin, isAuthenticated, account } = useAuthStore();

  useEffect(() => {
    if (inProgress !== 'none') return;

    if (accounts.length > 0) {
      const activeAccount = accounts[0];
      const acquireToken = async () => {
        try {
          const result = await instance.acquireTokenSilent({ ...loginRequest, account: activeAccount });
          setAccount(activeAccount, result.accessToken);

          if (isTauriApp() && activeAccount.localAccountId) {
            try {
              const { upsertUser, isUserAdmin } = await import('@/lib/db/queries/users');
              const now = new Date().toISOString();
              await upsertUser({
                id: activeAccount.localAccountId,
                email: activeAccount.username ?? '',
                name: activeAccount.name ?? 'Unknown',
                role: 'user',
                businessUnit: null,
                lastActiveAt: now,
                createdAt: now,
                updatedAt: now,
              });
              const admin = await isUserAdmin(activeAccount.localAccountId);
              setIsAdmin(admin);
            } catch (dbErr) {
              console.error('[auth] DB user sync failed (staying authenticated):', dbErr);
            }
          }
        } catch (err) {
          console.error('[auth] Silent token acquisition failed:', err);
          clearAuth();
        }
      };
      acquireToken();
    } else if (!isAuthenticated) {
      clearAuth();
    }
  }, [accounts, inProgress, instance, setAccount, clearAuth, setIsAdmin, isAuthenticated]);

  useEffect(() => {
    if (inProgress === 'none') {
      setLoading(false);
    }
  }, [inProgress, setLoading]);

  return { isAuthenticated, account, inProgress };
}
