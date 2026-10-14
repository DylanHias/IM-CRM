'use client';

import { useRouter } from 'next/navigation';
import { Wifi, WifiOff, Search, Upload, Loader2 } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncStore } from '@/store/syncStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Kbd } from '@/components/ui/kbd';
import { WindowFrame } from './WindowFrame';

const PILL = 'inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-[11px] font-medium';

function pendingTitle(activities: number, followUps: number, opportunities: number): string {
  const parts = [
    activities ? `${activities} ${activities === 1 ? 'activity' : 'activities'}` : '',
    followUps ? `${followUps} ${followUps === 1 ? 'follow-up' : 'follow-ups'}` : '',
    opportunities ? `${opportunities} ${opportunities === 1 ? 'opportunity' : 'opportunities'}` : '',
  ].filter(Boolean);
  return `${parts.join(' · ')} waiting to sync`;
}

export function TitleBar() {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const isSyncing = useSyncStore((s) => s.isSyncing);
  const pendingActivityCount = useSyncStore((s) => s.pendingActivityCount);
  const pendingFollowUpCount = useSyncStore((s) => s.pendingFollowUpCount);
  const pendingOpportunityCount = useSyncStore((s) => s.pendingOpportunityCount);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const totalPending = pendingActivityCount + pendingFollowUpCount + pendingOpportunityCount;

  return (
    <WindowFrame
      centerContent={
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-7 w-[min(380px,32vw)] items-center gap-2 rounded-md border border-border bg-card px-2.5 text-[12.5px] text-muted-foreground transition-colors hover:border-border-strong"
        >
          <Search size={14} className="shrink-0" />
          <span className="flex-1 text-left">Search</span>
          <Kbd className="h-[18px] bg-sunken font-sans text-[10.5px]">Ctrl K</Kbd>
        </button>
      }
    >
      <span data-tour="online-status" className={cn(PILL, isOnline ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
        {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
        {isOnline ? 'Online' : 'Offline'}
      </span>
      {isSyncing ? (
        <span className={cn(PILL, 'bg-accent text-accent-foreground')}>
          <Loader2 size={11} className="animate-spin" />
          Syncing…
        </span>
      ) : totalPending > 0 ? (
        <button
          type="button"
          onClick={() => router.push('/sync')}
          title={pendingTitle(pendingActivityCount, pendingFollowUpCount, pendingOpportunityCount)}
          className={cn(PILL, 'bg-warning/10 text-warning transition-colors hover:bg-warning/20')}
        >
          <Upload size={11} />
          {totalPending} pending
        </button>
      ) : null}
    </WindowFrame>
  );
}
