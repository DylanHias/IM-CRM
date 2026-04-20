'use client';

import { Suspense } from 'react';
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
  const compactMode = useSettingsStore((s) => s.compactMode);
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  useAutoSync();
  useLaunchAlerts();
  useConnectivityToasts();
  useShortcuts();

  return (
    <div className={cn('flex flex-col h-screen overflow-hidden bg-background transition-colors', compactMode && 'compact')}>
      <Suspense>
        <TitleBar />
      </Suspense>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className={cn('flex-1 overflow-y-auto', compactMode ? 'px-5 py-4' : 'px-7 py-6')}>
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
