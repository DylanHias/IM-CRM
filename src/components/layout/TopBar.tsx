'use client';

import { RefreshCw, Wifi, WifiOff, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { useSync } from '@/hooks/useSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { signOut } from '@/lib/auth/authHelpers';
import { formatRelative } from '@/lib/utils/dateUtils';
import styled from 'styled-components';

const Bar = styled.header`
  height: 60px;
  background-color: hsl(var(--topbar-bg));
  border-bottom: 1px solid hsl(var(--topbar-border));
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 10px;
  position: sticky;
  top: 0;
  z-index: 10;
  transition: background-color 0.2s ease, border-color 0.2s ease;
`;

const Title = styled.h1`
  font-size: 16px;
  font-weight: 600;
  color: hsl(var(--foreground));
  flex: 1;
  letter-spacing: -0.2px;
`;

const StatusPill = styled.div<{ $online: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: ${(p) =>
    p.$online ? 'hsl(var(--success))' : 'hsl(var(--destructive))'};
  padding: 4px 10px;
  border-radius: 20px;
  background-color: ${(p) =>
    p.$online
      ? 'hsl(var(--success) / 0.1)'
      : 'hsl(var(--destructive) / 0.1)'};
`;

const SyncInfo = styled.div`
  font-size: 12px;
  color: hsl(var(--muted-foreground));
`;

const UserName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: hsl(var(--foreground));
`;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface TopBarProps {
  title?: string;
}

export function TopBar({ title = 'Ingram Micro CRM' }: TopBarProps) {
  const { account } = useAuthStore();
  const { isSyncing, lastD365SyncAt, triggerSync } = useSync();
  const isOnline = useOnlineStatus();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Bar>
      <Title>{title}</Title>

      <StatusPill $online={isOnline}>
        {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
        {isOnline ? 'Online' : 'Offline'}
      </StatusPill>

      {lastD365SyncAt && (
        <SyncInfo>Last sync: {formatRelative(lastD365SyncAt)}</SyncInfo>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={triggerSync}
        disabled={isSyncing || !isOnline}
        className="h-8 gap-1.5"
      >
        <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
        {isSyncing ? 'Syncing...' : 'Sync'}
      </Button>

      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-primary/15 text-primary">
            {account?.name ? getInitials(account.name) : 'U'}
          </AvatarFallback>
        </Avatar>
        <UserName>{account?.name ?? 'User'}</UserName>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleSignOut}
          title="Sign out"
        >
          <LogOut size={14} />
        </Button>
      </div>
    </Bar>
  );
}
