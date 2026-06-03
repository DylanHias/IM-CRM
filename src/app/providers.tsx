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
import { ErrorScreen } from '@/components/layout/ErrorScreen';
import { Toaster } from 'sonner';
import type { PublicClientApplication } from '@azure/msal-browser';

function resolveTheme(theme: 'light' | 'dark' | 'system'): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

async function checkAndInstallUpdate(): Promise<boolean> {
  if (!isTauriApp()) return false;
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    if (!update) return false;
    if (update.body) await storeChangelog(update.body, update.version);
    await update.downloadAndInstall();
    const { relaunch } = await import('@tauri-apps/plugin-process');
    await relaunch();
    return true;
  } catch (err) {
    console.error('[updater] Update check failed:', err);
    return false;
  }
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

    if (await checkAndInstallUpdate()) return;

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
      // Check for app updates before anything else — ensures a broken startup
      // can self-heal once a fix is published, since the updater would otherwise
      // only run after the app shell has fully mounted.
      if (await checkAndInstallUpdate()) return;

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

      // Hydrate revenue + insights caches so every chart/KPI renders immediately
      // from the last sync. UI reads exclusively from local DB — no per-component
      // Power BI fetches.
      try {
        const [revenueModule, insightsModule, movementModule] = await Promise.all([
          import('@/lib/integrations/powerbi/revenueService'),
          import('@/lib/integrations/powerbi/revenueInsightsService'),
          import('@/lib/integrations/powerbi/customerRevenueDetailService'),
        ]);
        await Promise.all([
          revenueModule.loadRevenueFromDb(),
          insightsModule.loadInsightsFromDb(),
          movementModule.loadArrMovementFromDb(),
        ]);
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
            // Resolve to the D365-keyed row so the admin check and profile load target the
            // same row profile/birthday data lives on — not a stale MSAL-keyed duplicate.
            let dbId = account.localAccountId;
            try {
              const { isUserAdmin, resolveUserDbId } = await import('@/lib/db/queries/users');
              dbId = await resolveUserDbId(account.localAccountId, account.username);
              const admin = await isUserAdmin(dbId);
              useAuthStore.getState().setIsAdmin(admin);
            } catch (err) {
              console.error('[auth] Admin check after session restore failed:', err);
            }
            const { loadProfilePhoto } = await import('@/hooks/useAuth');
            await loadProfilePhoto(dbId);
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

  // Auto-recover from a failed DB init: if a fix has since been published,
  // download + install it without the user needing to click Retry.
  useEffect(() => {
    if (!dbError) return;
    void checkAndInstallUpdate();
  }, [dbError]);

  if (dbError) {
    return (
      <ErrorScreen
        title="Database failed to initialize"
        description={dbError}
        onRetry={retryInit}
        retrying={retrying}
      />
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
          position="top-right"
          closeButton
          theme={resolved}
          duration={10000}
        />
        {children}
      </ThemeProvider>
    </MsalProvider>
  );
}
