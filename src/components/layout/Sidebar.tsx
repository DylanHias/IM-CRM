'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, RefreshCw, CheckSquare, BarChart2 } from 'lucide-react';
import { useSyncStore } from '@/store/syncStore';
import { useFollowUpStore } from '@/store/followUpStore';
import { motion } from 'framer-motion';
import styled from 'styled-components';

const SidebarContainer = styled.aside`
  width: 220px;
  min-width: 220px;
  background-color: hsl(var(--sidebar-bg));
  border-right: 1px solid hsl(var(--sidebar-border));
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  transition: background-color 0.2s ease;
`;

const Logo = styled.div`
  padding: 18px 16px;
  border-bottom: 1px solid hsl(var(--sidebar-border));
  display: flex;
  align-items: center;
  gap: 11px;
`;

const LogoBadge = styled.div`
  width: 36px;
  height: 36px;
  background: #1570ef;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 800;
  color: white;
  letter-spacing: -0.5px;
  flex-shrink: 0;
`;

const LogoText = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: hsl(var(--sidebar-fg));
  letter-spacing: -0.3px;
`;

const LogoSub = styled.span`
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  font-weight: 500;
`;

const NavSection = styled.nav`
  flex: 1;
  padding: 10px 8px;
  overflow-y: auto;
`;

const NavLabel = styled.div`
  padding: 6px 8px 4px;
  font-size: 10px;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 2px;
`;

const NavLink = styled(Link) <{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 9px 12px 9px 14px;
  border-radius: 6px;
  font-size: 13.5px;
  font-weight: ${(p) => (p.$active ? '600' : '500')};
  color: ${(p) =>
    p.$active ? 'hsl(var(--sidebar-active-fg))' : 'hsl(var(--sidebar-fg))'};
  background-color: ${(p) =>
    p.$active ? 'hsl(var(--sidebar-active-bg))' : 'transparent'};
  border-left: 2px solid ${(p) =>
    p.$active ? 'hsl(var(--primary))' : 'transparent'};
  text-decoration: none;
  margin-bottom: 2px;
  transition: all 0.15s ease;
  position: relative;

  &:hover {
    background-color: ${(p) =>
    p.$active ? 'hsl(var(--sidebar-active-bg))' : 'hsl(var(--sidebar-hover-bg))'};
    color: ${(p) =>
    p.$active ? 'hsl(var(--sidebar-active-fg))' : 'hsl(var(--foreground))'};
    border-left-color: ${(p) =>
    p.$active ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.4)'};
  }
`;

const BadgePill = styled.span<{ $variant: 'destructive' | 'warning' }>`
  margin-left: auto;
  background-color: ${(p) =>
    p.$variant === 'destructive'
      ? 'hsl(var(--destructive))'
      : 'hsl(var(--warning))'};
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.4;
`;

const Footer = styled.div`
  padding: 12px 16px;
  border-top: 1px solid hsl(var(--sidebar-border));
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  line-height: 1.6;
`;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
};

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
      badgeVariant: 'warning' as const,
    },
    {
      href: '/followups',
      label: 'Follow-Ups',
      icon: CheckSquare,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeVariant: 'destructive' as const,
    },
    { href: '/arr-overview', label: 'ARR Overview', icon: BarChart2 },
  ];

  return (
    <SidebarContainer>
      <Logo>
        <LogoBadge>IM</LogoBadge>
        <div className="flex flex-col">
          <LogoText>Ingram CRM</LogoText>
          <LogoSub>Field Sales</LogoSub>
        </div>
      </Logo>

      <NavSection>
        <NavLabel>Navigation</NavLabel>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {navItems.map(({ href, label, icon: Icon, badge, badgeVariant }) => {
            const isActive = pathname.startsWith(href);
            return (
              <motion.div key={href} variants={itemVariants}>
                <NavLink href={href} $active={isActive}>
                  <Icon size={15} />
                  {label}
                  {badge && (
                    <BadgePill
                      $variant={badgeVariant}
                      className={badge > 0 ? 'animate-pulse' : ''}
                    >
                      {badge}
                    </BadgePill>
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </motion.div>
      </NavSection>

      <Footer>
        <div>Ingram Micro CRM</div>
        <div>v0.3.5</div>
      </Footer>
    </SidebarContainer>
  );
}
