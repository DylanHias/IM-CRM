'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users, CheckSquare, BarChart2, Target, LineChart, Gauge,
  ChevronsLeft, ChevronsRight, Download, Loader2, AlertTriangle,
  X, MoreVertical, Plus,
  House, Clock, Bookmark, CalendarClock,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import { useSyncStore } from '@/store/syncStore';
import { useFollowUpStore } from '@/store/followUpStore';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useCustomerStore } from '@/store/customerStore';
import { useAppUpdater } from '@/hooks/useAppUpdater';
import { useD365UserId } from '@/hooks/useD365UserId';
import { onDataEvent } from '@/lib/dataEvents';
import { cn } from '@/lib/utils';
import { ProfileModal } from './ProfileModal';
import { QuickAddMenu } from '@/components/dashboard/QuickAddMenu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

function getInitials(name: string): string {
  return formatDisplayName(name)
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Sync lives in the account modal and the title-bar pending pill, not in the sidebar.
const HIDDEN_FROM_SIDEBAR = new Set(['/sync']);

// Accent bar on the left edge of the active item.
const NAV_ITEM_ACTIVE =
  'relative before:absolute before:left-0 before:top-1/2 before:-mt-2 before:h-4 before:w-[3px] before:rounded-full before:bg-primary before:opacity-0 before:transition-opacity data-[active=true]:before:opacity-100';

function tileColor(name: string): React.CSSProperties {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  return { backgroundColor: `hsl(${hue} 55% 50% / 0.14)`, color: `hsl(${hue} 45% 42%)` };
}

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const { overdueCount, setOverdueCount } = useFollowUpStore();
  const { account, profilePhoto } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const d365UserId = useD365UserId();
  const recentCustomerIds = useUIStore((s) => s.recentCustomerIds);
  const clearRecentCustomers = useUIStore((s) => s.clearRecentCustomers);
  const customers = useCustomerStore((s) => s.customers);
  const favoriteIds = useCustomerStore((s) => s.favoriteIds);

  const refreshCounts = useCallback(async () => {
    if (isTauriApp()) {
      const { queryOverdueFollowUpCount } = await import('@/lib/db/queries/followups');
      const { countPendingActivities } = await import('@/lib/db/queries/activities');
      const { countPendingFollowUps } = await import('@/lib/db/queries/followups');
      const { countPendingOpportunities } = await import('@/lib/db/queries/opportunities');
      const [overdue, pendingAct, pendingFu, pendingOpp] = await Promise.all([
        queryOverdueFollowUpCount(d365UserId ?? account?.localAccountId ?? undefined, account?.localAccountId ?? undefined),
        countPendingActivities(),
        countPendingFollowUps(),
        countPendingOpportunities(),
      ]);
      setOverdueCount(overdue);
      useSyncStore.getState().setPendingCounts(pendingAct, pendingFu, pendingOpp);
    }
  }, [setOverdueCount, d365UserId, account?.localAccountId]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    return onDataEvent((e) => {
      if (e.entity === 'followup' || e.entity === 'activity' || e.entity === 'opportunity') {
        refreshCounts();
      }
    });
  }, [refreshCounts]);

  const { updateAvailable, downloading, install } = useAppUpdater();
  const [updatePopoverOpen, setUpdatePopoverOpen] = useState(false);

  const sidebarOrder = useSettingsStore((s) => s.sidebarOrder);
  const sidebarHiddenTabs = useSettingsStore((s) => s.sidebarHiddenTabs);

  const navItemMap: Record<string, { href: string; label: string; icon: typeof Users; badge?: number; badgeVariant?: 'destructive' | 'warning'; badgeStyle?: 'count'; disabled?: boolean; disabledTooltip?: string }> = {
    '/dashboard': { href: '/dashboard', label: 'Home', icon: House },
    '/customers': { href: '/customers', label: 'Customers', icon: Users },
    '/followups': {
      href: '/followups',
      label: 'Follow-Ups',
      icon: CheckSquare,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeVariant: 'destructive',
      badgeStyle: 'count',
    },
    '/opportunities': { href: '/opportunities', label: 'Pipeline', icon: Target },
    '/revenue-overview': { href: '/revenue-overview', label: 'Revenue Overview', icon: BarChart2 },
    '/insights': { href: '/insights', label: 'Insights', icon: Gauge },
    '/analytics': { href: '/analytics', label: 'Analytics', icon: LineChart },
    '/timeline': { href: '/timeline', label: 'Timeline', icon: CalendarClock },
  };

  const navItems = sidebarOrder
    .filter((key) => !sidebarHiddenTabs.includes(key) && !HIDDEN_FROM_SIDEBAR.has(key))
    .map((key) => navItemMap[key])
    .filter(Boolean);

  const recentCustomers = recentCustomerIds
    .map((id) => {
      const customer = customers.find((c) => c.id === id);
      return customer ? { id: customer.id, name: customer.name } : null;
    })
    .filter(Boolean) as { id: string; name: string }[];

  const favoriteCustomers = customers
    .filter((c) => favoriteIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-2 pb-0 pt-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <QuickAddMenu
              align="start"
              trigger={
                <SidebarMenuButton
                  title="New"
                  className="h-8 border border-border-strong bg-card font-medium shadow-sm hover:bg-surface-2 data-[state=open]:bg-surface-2 [&>svg]:text-primary"
                >
                  <Plus />
                  <span>New</span>
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ href, label, icon: Icon, badge, badgeVariant = 'warning', badgeStyle, disabled, disabledTooltip }) => {
                const isActive = !disabled && pathname.startsWith(href);
                if (disabled) {
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        disabled
                        tooltip={disabledTooltip ?? label}
                        className="opacity-40 cursor-not-allowed"
                      >
                        <Icon />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={label} className={NAV_ITEM_ACTIVE}>
                      <Link href={href}>
                        <Icon />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {badge != null && badgeStyle === 'count' && !collapsed && (
                      <SidebarMenuBadge
                        className={cn(
                          'text-[10px] font-bold min-w-[18px] h-[18px] rounded-full px-1',
                          badgeVariant === 'destructive'
                            ? 'bg-destructive text-destructive-foreground'
                            : 'bg-warning text-warning-foreground',
                        )}
                      >
                        {badge > 99 ? '99+' : badge}
                      </SidebarMenuBadge>
                    )}
                    {badge != null && (badgeStyle !== 'count' || collapsed) && (
                      <span
                        className={cn(
                          'absolute top-1.5 right-1.5 h-[7px] w-[7px] rounded-full border-[1.5px] border-sidebar',
                          badgeVariant === 'destructive' ? 'bg-destructive' : 'bg-warning',
                        )}
                      />
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {favoriteCustomers.length > 0 && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="gap-1.5 text-faint">
              <Bookmark className="!size-3" />
              Favorites
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {favoriteCustomers.map((c) => (
                  <CustomerLink key={c.id} customer={c} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {recentCustomers.length > 0 && (
          <SidebarGroup className="group/recent group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="gap-1.5 text-faint">
              <Clock className="!size-3" />
              Recent
            </SidebarGroupLabel>
            <button
              onClick={clearRecentCustomers}
              className="absolute right-3 top-3 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground opacity-0 group-hover/recent:opacity-100 transition-opacity"
            >
              <X className="size-3" />
              Clear
            </button>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentCustomers.map((c) => (
                  <CustomerLink key={c.id} customer={c} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {updateAvailable && (
          <SidebarMenu>
            <SidebarMenuItem>
              <Popover open={updatePopoverOpen} onOpenChange={setUpdatePopoverOpen}>
                <PopoverTrigger asChild>
                  <SidebarMenuButton
                    tooltip={downloading ? 'Downloading update…' : 'Update available'}
                    className={cn(
                      'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                      !downloading && 'animate-[pulse-blue_2s_ease-in-out_infinite]',
                    )}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Download />
                    )}
                    <span>{downloading ? 'Updating…' : 'Update'}</span>
                  </SidebarMenuButton>
                </PopoverTrigger>
                <PopoverContent side="right" align="end" className="w-64">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] leading-snug">The application will restart after updating.</p>
                  </div>
                  <button
                    onClick={() => {
                      setUpdatePopoverOpen(false);
                      install();
                    }}
                    className="mt-2.5 w-full h-8 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90"
                  >
                    Update now
                  </button>
                </PopoverContent>
              </Popover>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <CollapseButton />
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={account?.name ? formatDisplayName(account.name) : 'Account'}
              onClick={() => setProfileOpen(true)}
              className="group/profile"
            >
              <Avatar className="h-7 w-7 flex-shrink-0">
                {profilePhoto && (
                  <AvatarImage src={profilePhoto} alt={account?.name ?? 'User'} />
                )}
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
                  {account?.name ? getInitials(account.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold truncate flex-1 text-left">
                {account?.name ? formatDisplayName(account.name) : 'User'}
              </span>
              <MoreVertical
                size={14}
                className="ml-auto text-muted-foreground group-data-[collapsible=icon]:hidden"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </Sidebar>
  );
}

function CustomerLink({ customer }: { customer: { id: string; name: string } }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild tooltip={customer.name}>
        <Link href={`/customers?id=${customer.id}`}>
          <span
            className="grid size-[18px] shrink-0 place-items-center rounded-[5px] text-[9px] font-semibold"
            style={tileColor(customer.name)}
          >
            {getInitials(customer.name)}
          </span>
          <span className="truncate">{customer.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function CollapseButton() {
  const { toggleSidebar, state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <SidebarMenuButton
      onClick={toggleSidebar}
      tooltip={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
      <span>Collapse</span>
    </SidebarMenuButton>
  );
}
