'use client';

import { RefreshCw, Wifi, WifiOff, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { useSync } from '@/hooks/useSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { signOut } from '@/lib/auth/authHelpers';
import { formatRelative } from '@/lib/utils/dateUtils';
import styled from 'styled-components';

const Bar = styled.header`
  height: 56px;
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const Title = styled.h1`
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
`;

const StatusPill = styled.div<{ $online: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: ${(p) => (p.$online ? '#16a34a' : '#dc2626')};
  padding: 4px 10px;
  border-radius: 20px;
  background-color: ${(p) => (p.$online ? '#f0fdf4' : '#fef2f2')};
`;

const SyncInfo = styled.div`
  font-size: 12px;
  color: #64748b;
`;

const UserName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
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
          <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
            {account?.name ? getInitials(account.name) : 'U'}
          </AvatarFallback>
        </Avatar>
        <UserName>{account?.name ?? 'User'}</UserName>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSignOut} title="Sign out">
          <LogOut size={14} />
        </Button>
      </div>
    </Bar>
  );
}
