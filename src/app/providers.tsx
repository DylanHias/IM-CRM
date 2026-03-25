'use client';

import { useEffect, useState } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { ThemeProvider } from 'styled-components';
import { initializeMsal } from '@/lib/auth/msalInstance';
import { initDb } from '@/lib/db/client';
import { lightTheme, darkTheme } from '@/styles/theme';
import { useSettingsStore } from '@/store/settingsStore';
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
        console.error('[MSAL] Redirect handling failed:', err);
      }

      try {
        await initDb();
      } catch (err) {
        console.error('[DB] Initialization failed:', err);
      }
      setDbReady(true);

      // Hydrate settings from SQLite after DB is ready
      await useSettingsStore.getState().hydrateFromDb();

      setMsalInstance(instance);
    };
    init();
  }, []);

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
