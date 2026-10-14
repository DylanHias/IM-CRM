'use client';

import { Suspense, useEffect, useState } from 'react';
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
import { useAutoSync } from '@/hooks/useAutoSync';
import { useLaunchAlerts } from '@/hooks/useLaunchAlerts';
import { useConnectivityToasts } from '@/hooks/useConnectivityToasts';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useSyncShortcut } from '@/hooks/useSyncShortcut';
import { ViewBarSlotContext } from '@/components/ui/view-bar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const density = useSettingsStore((s) => s.density);
  const sidebarRememberLastState = useSettingsStore((s) => s.sidebarRememberLastState);
  const sidebarDefaultExpanded = useSettingsStore((s) => s.sidebarDefaultExpanded);
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const [viewBarSlot, setViewBarSlot] = useState<HTMLDivElement | null>(null);
  useAutoSync();
  useLaunchAlerts();
  useConnectivityToasts();
  useShortcuts();
  useSyncShortcut();

  // When "remember last sidebar state" is off, force the configured default on each mount.
  // Runs once on mount and again only if the user toggles the remember flag itself.
  useEffect(() => {
    if (!sidebarRememberLastState) {
      setSidebarOpen(sidebarDefaultExpanded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarRememberLastState]);

  // Page padding as CSS vars so full-bleed pages (split views) can cancel it exactly.
  const pagePadding = {
    '--page-px': density === 'compact' ? '12px' : '16px',
    '--page-pt': density === 'compact' ? '10px' : density === 'cozy' ? '12px' : '14px',
    '--page-pb': '28px',
  } as React.CSSProperties;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-chrome transition-colors">
      <Suspense>
        <TitleBar />
      </Suspense>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden rounded-tl-[10px] border-l border-t border-border bg-background">
          <div ref={setViewBarSlot} className="shrink-0 empty:hidden" />
          <ViewBarSlotContext.Provider value={viewBarSlot}>
            <div className="flex-1 overflow-y-auto px-[var(--page-px)] pb-[var(--page-pb)] pt-[var(--page-pt)]" style={pagePadding}>
              <PageMotion key={pathname}>{children}</PageMotion>
            </div>
          </ViewBarSlotContext.Provider>
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
