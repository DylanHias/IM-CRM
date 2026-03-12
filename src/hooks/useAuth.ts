'use client';

import { useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useAuthStore } from '@/store/authStore';
import { loginRequest } from '@/lib/auth/msalConfig';

export function useAuth() {
  const { instance, accounts, inProgress } = useMsal();
  const { setAccount, clearAuth, setLoading, isAuthenticated, account } = useAuthStore();

  useEffect(() => {
    if (inProgress !== 'none') return;

    if (accounts.length > 0) {
      const activeAccount = accounts[0];
      instance
        .acquireTokenSilent({ ...loginRequest, account: activeAccount })
        .then((result) => {
          setAccount(activeAccount, result.accessToken);
        })
        .catch(() => {
          clearAuth();
        });
    } else if (!isAuthenticated) {
      // Only clear if not already authenticated (e.g. via dev bypass)
      clearAuth();
    }
  }, [accounts, inProgress, instance, setAccount, clearAuth, isAuthenticated]);

  useEffect(() => {
    if (inProgress === 'none') {
      setLoading(false);
    }
  }, [inProgress, setLoading]);

  return { isAuthenticated, account, inProgress };
}
