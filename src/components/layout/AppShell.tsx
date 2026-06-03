'use client';

import { Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from './Sidebar';
import { TitleBar } from './TitleBar';
import { PageMotion } from './PageMotion';
import { ChangelogDialog } from './ChangelogDialog';
import { InitialSyncDialog } from './InitialSyncDialog';
import { CommandPalette } from './CommandPalette';
import { ShortcutsGuide } from './ShortcutsGuide';
import { Walkthrough } from '@/components/walkthrough/Walkthrough';
import { EasterEggController } from '@/components/easterEggs/EasterEggController';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { warmUp as warmUpOllama } from '@/lib/ai/ollamaService';
import { useAutoSync } from '@/hooks/useAutoSync';
import { useLaunchAlerts } from '@/hooks/useLaunchAlerts';
import { useConnectivityToasts } from '@/hooks/useConnectivityToasts';
import { useShortcuts } from '@/hooks/useShortcuts';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const density = useSettingsStore((s) => s.density);
  const sidebarRememberLastState = useSettingsStore((s) => s.sidebarRememberLastState);
  const sidebarDefaultExpanded = useSettingsStore((s) => s.sidebarDefaultExpanded);
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  useAutoSync();
  useLaunchAlerts();
  useConnectivityToasts();
  useShortcuts();

  // Warm up the local Ollama server in the background for admins so the AI
  // Assistant page is responsive on first open. The model itself is pulled
  // lazily when the page is opened — this only starts the server process.
  useEffect(() => {
    if (isAdmin) warmUpOllama();
  }, [isAdmin]);

  // When "remember last sidebar state" is off, force the configured default on each mount.
  // Runs once on mount and again only if the user toggles the remember flag itself.
  useEffect(() => {
    if (!sidebarRememberLastState) {
      setSidebarOpen(sidebarDefaultExpanded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarRememberLastState]);

  const paddingClass = density === 'compact' ? 'px-5 py-4' : density === 'cozy' ? 'px-6 py-5' : 'px-7 py-6';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background transition-colors">
      <Suspense>
        <TitleBar />
      </Suspense>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className={cn('flex-1 overflow-y-auto', paddingClass)}>
            <PageMotion key={pathname}>
              {children}
              <div className="h-12" />
            </PageMotion>
          </div>
        </main>
      </SidebarProvider>
      <Walkthrough />
      <EasterEggController />
      <ChangelogDialog />
      <InitialSyncDialog />
      <CommandPalette />
      <ShortcutsGuide />
    </div>
  );
}
