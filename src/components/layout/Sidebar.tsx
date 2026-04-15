'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users, RefreshCw, CheckSquare, BarChart2, FileText, Target, LineChart,
  ChevronsLeft, ChevronsRight, Download, Loader2, AlertTriangle,
  Settings, Keyboard, LogOut, Shield, Bug, Building2, X, HelpCircle,
  ChevronRight, LayoutDashboard, Clock, User, Bell, Bookmark, CalendarClock,
} from 'lucide-react';
import * as Collapsible from '@radix-ui/react-collapsible';
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
import { signOut } from '@/lib/auth/authHelpers';
import { onDataEvent } from '@/lib/dataEvents';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function getInitials(name: string): string {
  return formatDisplayName(name)
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const { pendingActivityCount, pendingFollowUpCount } = useSyncStore();
  const { overdueCount, setOverdueCount } = useFollowUpStore();
  const { account, isAdmin, profilePhoto } = useAuthStore();
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
      const [overdue, pendingAct, pendingFu] = await Promise.all([
        queryOverdueFollowUpCount(d365UserId ?? account?.localAccountId ?? undefined, account?.localAccountId ?? undefined),
        countPendingActivities(),
        countPendingFollowUps(),
      ]);
      setOverdueCount(overdue);
      useSyncStore.getState().setPendingCounts(pendingAct, pendingFu);
    }
  }, [setOverdueCount, d365UserId, account?.localAccountId]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    return onDataEvent((e) => {
      if (e.entity === 'followup' || e.entity === 'activity') {
        refreshCounts();
      }
    });
  }, [refreshCounts]);

  const totalPending = pendingActivityCount + pendingFollowUpCount;
  const { updateAvailable, downloading, install } = useAppUpdater();
  const [updatePopoverOpen, setUpdatePopoverOpen] = useState(false);

  const sidebarOrder = useSettingsStore((s) => s.sidebarOrder);

  const navItemMap: Record<string, { href: string; label: string; icon: typeof Users; badge?: number; badgeVariant?: 'destructive' | 'warning'; badgeStyle?: 'count'; disabled?: boolean; disabledTooltip?: string }> = {
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
    '/opportunities': { href: '/opportunities', label: 'Opportunities', icon: Target, disabled: true, disabledTooltip: 'Coming soon' },
    '/invoices': { href: '/invoices', label: 'Invoices', icon: FileText, disabled: true, disabledTooltip: 'Coming soon' },
    '/revenue-overview': { href: '/revenue-overview', label: 'Revenue Overview', icon: BarChart2 },
    '/analytics': { href: '/analytics', label: 'Analytics', icon: LineChart },
    '/timeline': { href: '/timeline', label: 'Timeline', icon: CalendarClock },
  };

  const navItems = sidebarOrder.map((key) => navItemMap[key]).filter(Boolean);

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
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
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
                    <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
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
            <SidebarGroupLabel>
              <Bookmark className="size-3 mr-1" />
              Favorites
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {favoriteCustomers.map((c) => (
                  <RecentCustomerItem key={c.id} customer={c} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {recentCustomers.length > 0 && (
          <SidebarGroup className="group/recent group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Recent</SidebarGroupLabel>
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
                  <RecentCustomerItem key={c.id} customer={c} />
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={account?.name ? formatDisplayName(account.name) : 'Account'}
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    {profilePhoto && (
                      <AvatarImage src={profilePhoto} alt={account?.name ?? 'User'} />
                    )}
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
                      {account?.name ? getInitials(account.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-semibold truncate">
                      {account?.name ? formatDisplayName(account.name) : 'User'}
                    </span>
                    {account?.username && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        {account.username}
                      </span>
                    )}
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56">
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    <Shield size={14} />
                    Admin panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings size={14} />
                  Account settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/debug')}>
                  <Bug size={14} />
                  Debug
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => useUIStore.getState().setShortcutsGuideOpen(true)}>
                  <Keyboard size={14} />
                  Keyboard shortcuts
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/help')}>
                  <HelpCircle size={14} />
                  Help
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut size={14} />
                  Log out
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    v{process.env.NEXT_PUBLIC_APP_VERSION}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

const customerSubNav = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'activities', label: 'Activities', icon: Clock },
  { key: 'contacts', label: 'Contacts', icon: User },
  { key: 'followups', label: 'Follow-Ups', icon: Bell },
] as const;

function RecentCustomerItem({ customer }: { customer: { id: string; name: string } }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible.Root asChild open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <Collapsible.Trigger asChild>
          <SidebarMenuButton tooltip={customer.name}>
            <Building2 />
            <span className="truncate">{customer.name}</span>
            <ChevronRight className={cn('ml-auto size-3.5 transition-transform', open && 'rotate-90')} />
          </SidebarMenuButton>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <SidebarMenuSub>
            {customerSubNav.map(({ key, label, icon: Icon }) => (
              <SidebarMenuSubItem key={key}>
                <SidebarMenuSubButton asChild size="sm">
                  <Link href={`/customers?id=${customer.id}&tab=${key}`}>
                    <Icon className="size-3.5" />
                    <span>{label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </Collapsible.Content>
      </SidebarMenuItem>
    </Collapsible.Root>
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
