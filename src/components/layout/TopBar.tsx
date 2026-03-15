'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, Wifi, WifiOff, LogOut, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { useSync } from '@/hooks/useSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { signOut } from '@/lib/auth/authHelpers';
import { formatRelative } from '@/lib/utils/dateUtils';
import styled from 'styled-components';

const Bar = styled.header`
  height: 52px;
  background-color: hsl(var(--topbar-bg));
  border-bottom: 1px solid hsl(var(--topbar-border));
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 8px;
  position: sticky;
  top: 0;
  z-index: 10;
  transition: background-color 0.2s ease, border-color 0.2s ease;
`;

const BreadcrumbArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const NavArrow = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: hsl(var(--muted-foreground));
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: hsl(var(--muted));
    color: hsl(var(--foreground));
  }
`;

const BreadcrumbSep = styled.span`
  color: hsl(var(--muted-foreground));
  font-size: 11px;
  user-select: none;
  margin: 0 2px;
`;

const BreadcrumbLink = styled(Link)`
  font-size: 13.5px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-decoration: none;
  transition: color 0.15s ease;
  white-space: nowrap;

  &:hover {
    color: hsl(var(--foreground));
  }
`;

const BreadcrumbCurrent = styled.span`
  font-size: 13.5px;
  font-weight: 600;
  color: hsl(var(--foreground));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PageTitle = styled.h1`
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--foreground));
  letter-spacing: -0.15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StatusPill = styled.div<{ $online: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 500;
  color: ${(p) =>
    p.$online ? 'hsl(var(--success))' : 'hsl(var(--destructive))'};
  padding: 3px 9px;
  border-radius: 20px;
  background-color: ${(p) =>
    p.$online
      ? 'hsl(var(--success) / 0.08)'
      : 'hsl(var(--destructive) / 0.08)'};
  border: 1px solid ${(p) =>
    p.$online
      ? 'hsl(var(--success) / 0.2)'
      : 'hsl(var(--destructive) / 0.2)'};
`;

const SyncInfo = styled.div`
  font-size: 11.5px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
`;

const UserName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: hsl(var(--foreground));
  white-space: nowrap;
`;

const Divider = styled.div`
  width: 1px;
  height: 20px;
  background-color: hsl(var(--border));
  margin: 0 4px;
`;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface Breadcrumb {
  label: string;
  href?: string;
}

interface TopBarProps {
  title?: string;
  breadcrumbs?: Breadcrumb[];
}

export function TopBar({ title = 'Ingram Micro CRM', breadcrumbs }: TopBarProps) {
  const router = useRouter();
  const { account } = useAuthStore();
  const { isSyncing, lastD365SyncAt, triggerSync } = useSync();
  const isOnline = useOnlineStatus();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Bar>
      <BreadcrumbArea>
        {breadcrumbs ? (
          <>
            <NavArrow onClick={() => router.back()} title="Go back">
              <ArrowLeft size={15} />
            </NavArrow>
            <NavArrow onClick={() => window.history.forward()} title="Go forward">
              <ArrowRight size={15} />
            </NavArrow>

            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {idx > 0 && <BreadcrumbSep>|</BreadcrumbSep>}
                {crumb.href ? (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbCurrent>{crumb.label}</BreadcrumbCurrent>
                )}
              </span>
            ))}
          </>
        ) : (
          <PageTitle>{title}</PageTitle>
        )}
      </BreadcrumbArea>

      <StatusPill $online={isOnline}>
        {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
        {isOnline ? 'Online' : 'Offline'}
      </StatusPill>

      {lastD365SyncAt && (
        <SyncInfo>Synced {formatRelative(lastD365SyncAt)}</SyncInfo>
      )}

      <Button
        variant="outline"
        size="sm"
        onClick={triggerSync}
        disabled={isSyncing || !isOnline}
        className="h-7 gap-1.5 text-xs px-3"
      >
        <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
        {isSyncing ? 'Syncing\u2026' : 'Sync'}
      </Button>

      <Divider />

      <div className="flex items-center gap-2">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
            {account?.name ? getInitials(account.name) : 'U'}
          </AvatarFallback>
        </Avatar>
        <UserName>{account?.name ?? 'User'}</UserName>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={handleSignOut}
          title="Sign out"
        >
          <LogOut size={13} />
        </Button>
      </div>
    </Bar>
  );
}
