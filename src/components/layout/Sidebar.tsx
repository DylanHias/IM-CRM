'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, RefreshCw, CheckSquare, BarChart2, FileText, ChevronsLeft, ChevronsRight, Download, Loader2 } from 'lucide-react';
import { useSyncStore } from '@/store/syncStore';
import { useFollowUpStore } from '@/store/followUpStore';
import { useUIStore } from '@/store/uiStore';
import { useAppUpdater } from '@/hooks/useAppUpdater';
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
  margin: 6px 0;
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

const Footer = styled.div`
  padding: 10px 10px;
  border-top: 1px solid hsl(var(--sidebar-border));
  width: 100%;
`;

const VersionLabel = styled.div`
  height: 32px;
  border-radius: 8px;
  background-color: hsl(var(--muted));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: hsl(var(--muted-foreground));
  letter-spacing: -0.3px;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
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


export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const collapsed = !sidebarOpen;
  const pathname = usePathname();
  const { pendingActivityCount, pendingFollowUpCount } = useSyncStore();
  const { overdueCount } = useFollowUpStore();

  const totalPending = pendingActivityCount + pendingFollowUpCount;
  const { updateAvailable, downloading, install } = useAppUpdater();

  const navItems = [
    { href: '/customers', label: 'Customers', icon: Users },
    {
      href: '/sync',
      label: 'Sync',
      icon: RefreshCw,
      badge: totalPending > 0 ? totalPending : undefined,
      badgeVariant: 'warning' as const,
    },
    {
      href: '/followups',
      label: 'Follow-Ups',
      icon: CheckSquare,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeVariant: 'destructive' as const,
      badgeStyle: 'count' as const,
    },
    { href: '/invoices', label: 'Invoices', icon: FileText },
    { href: '/arr-overview', label: 'ARR Overview', icon: BarChart2 },
  ];

  return (
    <SidebarContainer
      initial={false}
      animate={{ width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH, minWidth: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      <NavSection>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', padding: '0 10px' }}>
          {navItems.map(({ href, label, icon: Icon, badge, badgeVariant, badgeStyle }) => {
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
            <UpdateButton
              onClick={install}
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

      <Footer>
        <VersionLabel title={`v${process.env.NEXT_PUBLIC_APP_VERSION}`}>
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </VersionLabel>
      </Footer>
    </SidebarContainer>
  );
}
