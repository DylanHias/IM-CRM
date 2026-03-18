'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RefreshCw, Wifi, WifiOff, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { useSync } from '@/hooks/useSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { signOut } from '@/lib/auth/authHelpers';
import { formatRelative } from '@/lib/utils/dateUtils';
import { WindowFrame } from './WindowFrame';
import styled from 'styled-components';

const NoDrag = styled.div`
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
  app-region: no-drag;
`;

const AppControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding-right: 4px;
  -webkit-app-region: no-drag;
  app-region: no-drag;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 500;
  color: hsl(var(--titlebar-fg) / 0.6);
  text-decoration: none;
  transition: color 0.15s ease;
  white-space: nowrap;
  margin-left: 16px;

  &:hover {
    color: hsl(var(--titlebar-fg));
  }
`;

const StatusPill = styled.div<{ $online: boolean }>`
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10.5px;
  font-weight: 500;
  color: ${(p) =>
    p.$online ? 'hsl(var(--success))' : 'hsl(var(--destructive))'};
  padding: 2px 7px;
  border-radius: 20px;
  background-color: ${(p) =>
    p.$online
      ? 'hsl(var(--success) / 0.08)'
      : 'hsl(var(--destructive) / 0.08)'};
`;

const SyncInfo = styled.span`
  font-size: 10.5px;
  color: hsl(var(--titlebar-fg) / 0.5);
  white-space: nowrap;
`;

const UserName = styled.span`
  font-size: 11.5px;
  font-weight: 500;
  color: hsl(var(--titlebar-fg));
  white-space: nowrap;
`;

const Divider = styled.div`
  width: 1px;
  height: 16px;
  background-color: hsl(var(--titlebar-fg) / 0.15);
  margin: 0 2px;
`;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function useBackLink(): { label: string; href: string } | undefined {
  const pathname = usePathname();
  if (/^\/customers\/[^/]+$/.test(pathname))
    return { label: 'All customers', href: '/customers' };
  return undefined;
}

export function TitleBar() {
  const backLink = useBackLink();
  const { account } = useAuthStore();
  const { isSyncing, lastD365SyncAt, triggerSync } = useSync();
  const isOnline = useOnlineStatus();

  return (
    <WindowFrame>
      {backLink && (
        <NoDrag>
          <BackLink href={backLink.href}>
            <ArrowLeft size={12} />
            {backLink.label}
          </BackLink>
        </NoDrag>
      )}

      <AppControls>
        <StatusPill $online={isOnline}>
          {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
          {isOnline ? 'Online' : 'Offline'}
        </StatusPill>

        {lastD365SyncAt && (
          <SyncInfo>Synced {formatRelative(lastD365SyncAt)}</SyncInfo>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={triggerSync}
          disabled={isSyncing || !isOnline}
          className="h-6 gap-1 text-[10.5px] px-2 text-[hsl(var(--titlebar-fg)/0.7)] hover:text-[hsl(var(--titlebar-fg))] hover:bg-[hsl(var(--titlebar-fg)/0.08)]"
        >
          <RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing\u2026' : 'Sync'}
        </Button>

        <Divider />

        <div className="flex items-center gap-1.5">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
              {account?.name ? getInitials(account.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <UserName>{account?.name ?? 'User'}</UserName>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-[hsl(var(--titlebar-fg)/0.5)] hover:text-[hsl(var(--titlebar-fg))] hover:bg-[hsl(var(--titlebar-fg)/0.08)]"
            onClick={() => signOut()}
            title="Sign out"
          >
            <LogOut size={11} />
          </Button>
        </div>

        <Divider />
      </AppControls>
    </WindowFrame>
  );
}
