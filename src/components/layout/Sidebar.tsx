'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, RefreshCw, CheckSquare, BarChart2, FileText, Target, ChevronsLeft, ChevronsRight, Download, Loader2, AlertTriangle, Settings, Keyboard, LogOut, Shield } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { useSyncStore } from '@/store/syncStore';
import { useFollowUpStore } from '@/store/followUpStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useAppUpdater } from '@/hooks/useAppUpdater';
import { signOut } from '@/lib/auth/authHelpers';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const SIDEBAR_COLLAPSED_WIDTH = 60;
const SIDEBAR_EXPANDED_WIDTH = 200;

const SidebarContainer = styled(motion.aside)`
  background-color: hsl(var(--sidebar-bg));
  box-shadow: 1px 0 0 hsl(var(--sidebar-border));
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  transition: background-color 0.2s ease;
`;


const NavSection = styled.nav`
  flex: 1;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: auto;
  width: 100%;
`;

const NavItem = styled(Link)<{ $active: boolean }>`
  position: relative;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  margin: 3px 0;
  width: 100%;
  overflow: hidden;
  color: ${(p) =>
    p.$active ? 'hsl(var(--sidebar-active-fg))' : 'hsl(var(--sidebar-fg))'};
  background-color: ${(p) =>
    p.$active ? 'hsl(var(--sidebar-active-bg))' : 'transparent'};
  text-decoration: none;
  transition: background-color 0.15s ease, color 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background-color: ${(p) =>
      p.$active ? 'hsl(var(--sidebar-active-bg))' : 'hsl(var(--sidebar-hover-bg))'};
    color: ${(p) =>
      p.$active ? 'hsl(var(--sidebar-active-fg))' : 'hsl(var(--foreground))'};
  }
`;

const NavLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 17px;
`;

const BadgeDot = styled.span<{ $variant: 'destructive' | 'warning' }>`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: ${(p) =>
    p.$variant === 'destructive'
      ? 'hsl(var(--destructive))'
      : 'hsl(var(--warning))'};
  border: 1.5px solid hsl(var(--sidebar-bg));
`;

const BadgeCount = styled.span<{ $variant: 'destructive' | 'warning' }>`
  margin-left: auto;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  flex-shrink: 0;
  background-color: ${(p) =>
    p.$variant === 'destructive'
      ? 'hsl(var(--destructive))'
      : 'hsl(var(--warning))'};
  color: ${(p) =>
    p.$variant === 'destructive'
      ? 'hsl(var(--destructive-foreground))'
      : 'hsl(var(--warning-foreground, var(--foreground)))'};
`;

const AccountSection = styled.div`
  padding: 10px;
  border-top: 1px solid hsl(var(--sidebar-border));
  width: 100%;
`;

const AccountTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 8px;
  border-radius: 10px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  transition: background-color 0.15s ease;
  overflow: hidden;

  &:hover {
    background-color: hsl(var(--sidebar-hover-bg));
  }
`;

const AccountName = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--sidebar-fg));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
`;

const AccountEmail = styled.span`
  font-size: 10px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
`;

const PopoverMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: 6px;
  background-color: transparent;
  color: hsl(var(--foreground));
  font-size: 12.5px;
  cursor: pointer;
  transition: background-color 0.1s ease;

  &:hover {
    background-color: hsl(var(--muted));
  }
`;

const PopoverVersion = styled.span`
  margin-left: auto;
  font-size: 10px;
  color: hsl(var(--muted-foreground));
`;

const UpdateButton = styled.button`
  height: 40px;
  border-radius: 10px;
  border: none;
  background-color: hsl(var(--primary));
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  width: 100%;
  overflow: hidden;
  color: hsl(var(--primary-foreground));
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  animation: pulse-blue 2s ease-in-out infinite;

  @keyframes pulse-blue {
    0%, 100% {
      background-color: hsl(var(--primary));
    }
    50% {
      background-color: hsl(var(--primary) / 0.7);
    }
  }

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
    animation: none;
  }
`;

const SpinningIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 17px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ConfirmButton = styled.button`
  margin-top: 10px;
  width: 100%;
  height: 32px;
  border-radius: 8px;
  border: none;
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const ToggleButton = styled.button`
  height: 40px;
  border-radius: 10px;
  border: none;
  background-color: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  width: 100%;
  overflow: hidden;
  color: hsl(var(--sidebar-fg));
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background-color: hsl(var(--sidebar-hover-bg));
    color: hsl(var(--foreground));
  }
`;

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const collapsed = !sidebarOpen;
  const pathname = usePathname();
  const router = useRouter();
  const { pendingActivityCount, pendingFollowUpCount } = useSyncStore();
  const { overdueCount, setOverdueCount } = useFollowUpStore();
  const { account, isAdmin } = useAuthStore();
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (isTauriApp()) {
        const { queryOverdueFollowUpCount } = await import('@/lib/db/queries/followups');
        const count = await queryOverdueFollowUpCount();
        setOverdueCount(count);
      } else {
        const { mockFollowUps } = await import('@/lib/mock/followups');
        const today = new Date().toISOString().split('T')[0];
        setOverdueCount(mockFollowUps.filter((f) => !f.completed && f.dueDate < today).length);
      }
    };
    load();
  }, [setOverdueCount]);

  const totalPending = pendingActivityCount + pendingFollowUpCount;
  const { updateAvailable, downloading, install } = useAppUpdater();
  const [updatePopoverOpen, setUpdatePopoverOpen] = useState(false);

  const sidebarOrder = useSettingsStore((s) => s.sidebarOrder);

  const navItemMap: Record<string, { href: string; label: string; icon: typeof Users; badge?: number; badgeVariant?: 'destructive' | 'warning'; badgeStyle?: 'count' }> = {
    '/customers': { href: '/customers', label: 'Customers', icon: Users },
    '/sync': {
      href: '/sync',
      label: 'Sync',
      icon: RefreshCw,
      badge: totalPending > 0 ? totalPending : undefined,
      badgeVariant: 'warning',
    },
    '/followups': {
      href: '/followups',
      label: 'Follow-Ups',
      icon: CheckSquare,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeVariant: 'destructive',
      badgeStyle: 'count',
    },
    '/opportunities': { href: '/opportunities', label: 'Opportunities', icon: Target },
    '/invoices': { href: '/invoices', label: 'Invoices', icon: FileText },
    '/arr-overview': { href: '/arr-overview', label: 'ARR Overview', icon: BarChart2 },
  };

  const navItems = sidebarOrder.map((key) => navItemMap[key]).filter(Boolean);

  return (
    <SidebarContainer
      initial={false}
      animate={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH, minWidth: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      <NavSection>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', padding: '0 10px' }}>
          {navItems.map(({ href, label, icon: Icon, badge, badgeVariant = 'warning', badgeStyle }) => {
            const isActive = pathname.startsWith(href);
            return (
              <div key={href} style={{ width: '100%' }}>
                <NavItem href={href} $active={isActive} title={label}>
                  <IconWrapper><Icon size={17} /></IconWrapper>
                  <NavLabel>{label}</NavLabel>
                  {badge != null && badgeStyle === 'count' && !collapsed ? (
                    <BadgeCount $variant={badgeVariant}>{badge > 99 ? '99+' : badge}</BadgeCount>
                  ) : badge != null ? (
                    <BadgeDot $variant={badgeVariant} />
                  ) : null}
                </NavItem>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 10px' }}>
          {updateAvailable && (
            <Popover open={updatePopoverOpen} onOpenChange={setUpdatePopoverOpen}>
              <PopoverTrigger asChild>
                <UpdateButton
                  disabled={downloading}
                  title={downloading ? 'Downloading update…' : 'Update available'}
                >
                  {downloading ? (
                    <SpinningIcon><Loader2 size={17} /></SpinningIcon>
                  ) : (
                    <IconWrapper><Download size={17} /></IconWrapper>
                  )}
                  <NavLabel>{downloading ? 'Updating…' : 'Update'}</NavLabel>
                </UpdateButton>
              </PopoverTrigger>
              <PopoverContent side="right" align="end" className="w-64">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
                  <p style={{ fontSize: '13px', lineHeight: '1.4' }}>The application will restart after updating.</p>
                </div>
                <ConfirmButton
                  onClick={() => {
                    setUpdatePopoverOpen(false);
                    install();
                  }}
                >
                  Update now
                </ConfirmButton>
              </PopoverContent>
            </Popover>
          )}
          <ToggleButton
            onClick={toggleSidebar}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <IconWrapper>
              {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
            </IconWrapper>
            <NavLabel>Collapse</NavLabel>
          </ToggleButton>
        </div>
      </NavSection>

      <AccountSection>
        <Popover open={accountPopoverOpen} onOpenChange={setAccountPopoverOpen}>
          <PopoverTrigger asChild>
            <AccountTrigger title={account?.name ?? 'Account'}>
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
                  {account?.name ? getInitials(account.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <AccountName>{account?.name ?? 'User'}</AccountName>
                  {account?.username && <AccountEmail>{account.username}</AccountEmail>}
                </div>
              )}
            </AccountTrigger>
          </PopoverTrigger>
          <PopoverContent side="right" align="end" className="w-56 p-1.5">
            <div className="flex flex-col gap-0.5">
              {isAdmin && (
                <PopoverMenuItem
                  onClick={() => {
                    setAccountPopoverOpen(false);
                    router.push('/admin');
                  }}
                >
                  <Shield size={14} />
                  Admin panel
                </PopoverMenuItem>
              )}
              <PopoverMenuItem
                onClick={() => {
                  setAccountPopoverOpen(false);
                  router.push('/settings');
                }}
              >
                <Settings size={14} />
                Account settings
              </PopoverMenuItem>
              <PopoverMenuItem disabled style={{ opacity: 0.5, cursor: 'default' }}>
                <Keyboard size={14} />
                Keyboard shortcuts
              </PopoverMenuItem>
              <div className="h-px bg-border my-1" />
              <PopoverMenuItem
                onClick={() => {
                  setAccountPopoverOpen(false);
                  signOut();
                }}
              >
                <LogOut size={14} />
                Log out
                <PopoverVersion>v{process.env.NEXT_PUBLIC_APP_VERSION}</PopoverVersion>
              </PopoverMenuItem>
            </div>
          </PopoverContent>
        </Popover>
      </AccountSection>
    </SidebarContainer>
  );
}
