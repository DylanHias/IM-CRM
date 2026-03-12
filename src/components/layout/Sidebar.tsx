'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, RefreshCw, CheckSquare, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSyncStore } from '@/store/syncStore';
import { useFollowUpStore } from '@/store/followUpStore';
import styled from 'styled-components';

const SidebarContainer = styled.aside`
  width: 240px;
  min-width: 240px;
  background-color: #1a2234;
  border-right: 1px solid #243044;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const Logo = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #243044;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoText = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: white;
  letter-spacing: -0.3px;
`;

const LogoSub = styled.span`
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
`;

const NavSection = styled.nav`
  flex: 1;
  padding: 12px 8px;
  overflow-y: auto;
`;

const NavItem = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: ${(p) => (p.$active ? 'white' : '#94a3b8')};
  background-color: ${(p) => (p.$active ? '#3b82f6' : 'transparent')};
  text-decoration: none;
  margin-bottom: 2px;
  transition: all 0.15s ease;

  &:hover {
    background-color: ${(p) => (p.$active ? '#3b82f6' : '#243044')};
    color: white;
  }
`;

const Badge = styled.span`
  margin-left: auto;
  background-color: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
`;

const SyncBadge = styled.span`
  margin-left: auto;
  background-color: #f59e0b;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
`;

const Footer = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #243044;
  font-size: 11px;
  color: #475569;
`;

export function Sidebar() {
  const pathname = usePathname();
  const { pendingActivityCount, pendingFollowUpCount } = useSyncStore();
  const { overdueCount } = useFollowUpStore();

  const totalPending = pendingActivityCount + pendingFollowUpCount;

  const navItems = [
    { href: '/customers', label: 'Customers', icon: Users },
    {
      href: '/sync',
      label: 'Sync',
      icon: RefreshCw,
      badge: totalPending > 0 ? totalPending : undefined,
      badgeType: 'sync' as const,
    },
    {
      href: '/followups',
      label: 'Follow-Ups',
      icon: CheckSquare,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeType: 'overdue' as const,
    },
  ];

  return (
    <SidebarContainer>
      <Logo>
        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white font-bold text-sm">
          IM
        </div>
        <div className="flex flex-col">
          <LogoText>Ingram CRM</LogoText>
          <LogoSub>Field Sales</LogoSub>
        </div>
      </Logo>

      <NavSection>
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          Navigation
        </div>
        {navItems.map(({ href, label, icon: Icon, badge, badgeType }) => {
          const isActive = pathname.startsWith(href);
          return (
            <NavItem key={href} href={href} $active={isActive}>
              <Icon size={16} />
              {label}
              {badge && badgeType === 'sync' && <SyncBadge>{badge}</SyncBadge>}
              {badge && badgeType === 'overdue' && <Badge>{badge}</Badge>}
            </NavItem>
          );
        })}
      </NavSection>

      <Footer>
        <div>Ingram Micro CRM</div>
        <div>v0.1.0 MVP</div>
      </Footer>
    </SidebarContainer>
  );
}
