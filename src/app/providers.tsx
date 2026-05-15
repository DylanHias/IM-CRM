'use client';

import '@/lib/logCapture';
import { useEffect, useState } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { ThemeProvider } from 'styled-components';
import { initializeMsal } from '@/lib/auth/msalInstance';
import { initDb } from '@/lib/db/client';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { storeChangelog } from '@/components/layout/ChangelogDialog';
import { lightTheme, darkTheme } from '@/styles/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { useOptionSetStore } from '@/store/optionSetStore';
import { useLookupTableStore } from '@/store/lookupTableStore';
import { useAuthStore } from '@/store/authStore';
import { ThemeSync } from '@/components/layout/ThemeSync';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
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
  const [retrying, setRetrying] = useState(false);
  const theme = useSettingsStore((s) => s.theme);

  const retryInit = async () => {
    setRetrying(true);
    setDbError(null);

    if (isTauriApp()) {
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const update = await check();
        if (update) {
          if (update.body) await storeChangelog(update.body, update.version);
          await update.downloadAndInstall();
          const { relaunch } = await import('@tauri-apps/plugin-process');
          await relaunch();
          return;
        }
      } catch (err) {
        console.error('[updater] Retry update check failed:', err);
      }
    }

    try {
      await initDb();
      setDbReady(true);
      await Promise.all([
        useSettingsStore.getState().hydrateFromDb(),
        useOptionSetStore.getState().hydrateFromDb(),
        useLookupTableStore.getState().hydrateFromDb(),
      ]);
    } catch (err) {
      console.error('[db] Retry failed:', err);
      setDbError(err instanceof Error ? err.message : 'Database initialization failed');
    } finally {
      setRetrying(false);
    }
  };

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

      // Hydrate settings, option sets, and lookup tables from SQLite after DB is ready
      await Promise.all([
        useSettingsStore.getState().hydrateFromDb(),
        useOptionSetStore.getState().hydrateFromDb(),
        useLookupTableStore.getState().hydrateFromDb(),
      ]);

      // Hydrate revenue cache so customer ARR renders immediately from the last refresh
      try {
        const { loadRevenueFromDb } = await import('@/lib/integrations/powerbi/revenueService');
        await loadRevenueFromDb();
      } catch (err) {
        console.error('[revenue] hydrate failed:', err);
      }

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
            const { loadProfilePhoto } = await import('@/hooks/useAuth');
            await loadProfilePhoto(account.localAccountId);
          }

          // Auth restored — kick off background revenue refresh if cache is stale.
          // Runs detached from the init flow so a slow/failing Power BI call never blocks the app shell.
          void (async () => {
            try {
              const { getAccessToken } = await import('@/lib/auth/authHelpers');
              const { powerBiRequest } = await import('@/lib/auth/msalConfig');
              const { maybeAutoRefresh } = await import('@/lib/integrations/powerbi/revenueService');
              const token = await getAccessToken(powerBiRequest.scopes);
              if (token) await maybeAutoRefresh(token);
            } catch (err) {
              console.error('[revenue] auto-refresh init failed:', err);
            }
          })();
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
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="space-y-2">
            <p className="text-destructive font-medium">Database failed to initialize</p>
            <p className="text-sm text-muted-foreground break-words">{dbError}</p>
          </div>
          <Button onClick={retryInit} disabled={retrying} size="sm">
            {retrying ? 'Retrying…' : 'Retry'}
          </Button>
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
        <Toaster
          position="bottom-right"
          closeButton
          theme={resolved}
          duration={10000}
        />
        {children}
      </ThemeProvider>
    </MsalProvider>
  );
}
