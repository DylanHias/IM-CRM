import type { SidebarTab } from '@/store/settingsStore';

/**
 * Pages that don't get their own sidebar entry: Sync lives in the account menu, Follow-Ups is part of
 * Activity, and Insights and Analytics are tabs of Reports.
 */
export const HIDDEN_FROM_SIDEBAR: ReadonlySet<SidebarTab> = new Set<SidebarTab>(['/sync', '/followups', '/insights', '/analytics']);

export const NAV_LABELS: Record<SidebarTab, string> = {
  '/dashboard': 'Home',
  '/customers': 'Customers',
  '/opportunities': 'Pipeline',
  '/timeline': 'Activity',
  '/revenue-overview': 'Reports',
  '/insights': 'Insights',
  '/analytics': 'Analytics',
  '/sync': 'Sync',
  '/followups': 'Follow-Ups',
};

/** Extra routes that belong to a sidebar entry. */
const NAV_MATCHES: Partial<Record<SidebarTab, string[]>> = {
  '/timeline': ['/timeline', '/followups'],
  '/revenue-overview': ['/revenue-overview', '/insights', '/analytics'],
};

/** Sidebar entries in the user's order, without folded-in pages or tabs they hid. Number shortcuts follow this list. */
export function visibleSidebarTabs(order: SidebarTab[], userHidden: SidebarTab[] = []): SidebarTab[] {
  return order.filter((t) => !HIDDEN_FROM_SIDEBAR.has(t) && !userHidden.includes(t));
}

export function isNavActive(tab: SidebarTab, pathname: string): boolean {
  return (NAV_MATCHES[tab] ?? [tab]).some((route) => pathname.startsWith(route));
}
