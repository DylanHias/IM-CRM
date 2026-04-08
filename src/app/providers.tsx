'use client';

import '@/lib/logCapture';
import { useEffect, useState } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { ThemeProvider } from 'styled-components';
import { initializeMsal } from '@/lib/auth/msalInstance';
import { initDb } from '@/lib/db/client';
import { lightTheme, darkTheme } from '@/styles/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { useOptionSetStore } from '@/store/optionSetStore';
import { useAuthStore } from '@/store/authStore';
import { ThemeSync } from '@/components/layout/ThemeSync';
import { Toaster } from 'sonner';
import type { PublicClientApplication } from '@azure/msal-browser';

function resolveTheme(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const init = async () => {
      const instance = await initializeMsal();

      // Handle MSAL redirect response (Tauri uses loginRedirect instead of loginPopup)
      try {
        const response = await instance.handleRedirectPromise();
        if (response?.account) {
          instance.setActiveAccount(response.account);
          useAuthStore.getState().setAccount(response.account, response.accessToken);
        }
      } catch (err) {
        console.error('[msal] Redirect handling failed:', err);
      }

      try {
        await initDb();
        setDbReady(true);
      } catch (err) {
        console.error('[db] Initialization failed:', err);
        setDbError(err instanceof Error ? err.message : 'Database initialization failed');
      }

      // Hydrate settings and option sets from SQLite after DB is ready
      await Promise.all([
        useSettingsStore.getState().hydrateFromDb(),
        useOptionSetStore.getState().hydrateFromDb(),
      ]);

      // Restore Tauri session from persisted refresh token
      try {
        const { restoreSession } = await import('@/lib/auth/authHelpers');
        const restored = await restoreSession();
        if (restored) {
          const account = useAuthStore.getState().account;
          if (account?.localAccountId) {
            try {
              const { isUserAdmin } = await import('@/lib/db/queries/users');
              const admin = await isUserAdmin(account.localAccountId);
              useAuthStore.getState().setIsAdmin(admin);
            } catch (err) {
              console.error('[auth] Admin check after session restore failed:', err);
            }
          }
        }
      } catch (err) {
        console.error('[auth] Session restore failed:', err);
      }

      setMsalInstance(instance);
    };
    init();
  }, []);

  if (dbError) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Database failed to initialize</p>
          <p className="text-sm text-muted-foreground">{dbError}</p>
        </div>
      </div>
    );
  }

  if (!msalInstance || !dbReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const resolved = resolveTheme(theme);

  return (
    <MsalProvider instance={msalInstance}>
      <ThemeProvider theme={resolved === 'dark' ? darkTheme : lightTheme}>
        <ThemeSync />
        <Toaster position="bottom-right" closeButton theme={resolved} duration={10000} />
        {children}
      </ThemeProvider>
    </MsalProvider>
  );
}
