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
import { AiChatWidget } from '@/components/ai-chat';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useSettingsStore } from '@/store/settingsStore';
import { useUIStore } from '@/store/uiStore';
import { warmUp as warmUpOllama } from '@/lib/ai/ollamaService';
import { useAutoSync } from '@/hooks/useAutoSync';
import { useLaunchAlerts } from '@/hooks/useLaunchAlerts';
import { useConnectivityToasts } from '@/hooks/useConnectivityToasts';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useSyncShortcut } from '@/hooks/useSyncShortcut';
import { ViewBarSlotContext } from '@/components/ui/view-bar';
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
  const [viewBarSlot, setViewBarSlot] = useState<HTMLDivElement | null>(null);
  useAutoSync();
  useLaunchAlerts();
  useConnectivityToasts();
  useShortcuts();
  useSyncShortcut();

  // Warm up the local Ollama server in the background so the AI Assistant
  // widget is responsive on first open. The model itself is pulled lazily when
  // the widget is opened — this only starts the server process.
  useEffect(() => {
    warmUpOllama();
  }, []);

  // When "remember last sidebar state" is off, force the configured default on each mount.
  // Runs once on mount and again only if the user toggles the remember flag itself.
  useEffect(() => {
    if (!sidebarRememberLastState) {
      setSidebarOpen(sidebarDefaultExpanded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarRememberLastState]);

  const paddingClass = density === 'compact' ? 'px-3 pt-2.5' : density === 'cozy' ? 'px-4 pt-3' : 'px-4 pt-3.5';

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
            <div className={cn('flex-1 overflow-y-auto pb-7', paddingClass)}>
              <PageMotion key={pathname}>{children}</PageMotion>
            </div>
          </ViewBarSlotContext.Provider>
        </main>
      </SidebarProvider>
      <Walkthrough />
      <EasterEggController />
      <AiChatWidget />
      <ChangelogDialog />
      <InitialSyncDialog />
      <CommandPalette />
      <ShortcutsGuide />
    </div>
  );
}
