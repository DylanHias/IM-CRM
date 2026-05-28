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
import { SidebarProvider } from '@/components/ui/sidebar';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
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
  useAutoSync();
  useLaunchAlerts();
  useConnectivityToasts();
  useShortcuts();

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
      <ChangelogDialog />
      <InitialSyncDialog />
      <CommandPalette />
      <ShortcutsGuide />
    </div>
  );
}
