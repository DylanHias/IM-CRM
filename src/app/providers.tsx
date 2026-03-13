'use client';

import { useEffect, useState } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { ThemeProvider } from 'styled-components';
import { initializeMsal } from '@/lib/auth/msalInstance';
import { initDb } from '@/lib/db/client';
import { lightTheme } from '@/styles/theme';
import type { PublicClientApplication } from '@azure/msal-browser';

export function Providers({ children }: { children: React.ReactNode }) {
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);

  useEffect(() => {
    // Initialize MSAL
    initializeMsal().then((instance) => {
      setMsalInstance(instance);
    });

    // Initialize SQLite DB
    initDb().catch((err) => {
      console.error('[DB] Initialization failed:', err);
    });
  }, []);

  if (!msalInstance) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <ThemeProvider theme={lightTheme}>
        {children}
      </ThemeProvider>
    </MsalProvider>
  );
}
