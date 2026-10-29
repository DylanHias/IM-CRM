'use client';

import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { periodKey } from '@/lib/reports/period';
import type { ReportFilters } from '@/components/reports/ReportControls';
import type { ReportScope } from '@/lib/reports/scope';

/**
 * The scope every Reports tab queries with, plus the key that decides when to reload.
 *
 * `scope` is null while Mine is selected and no user id has resolved yet: an empty `userIds`
 * matches nothing, so the queries would succeed with zeros and the tab would render an empty
 * report that reads as real. Callers show their loading state instead.
 */
export function useReportScope({ scope, region, period }: ReportFilters): { scope: ReportScope | null; key: string } {
  const account = useAuthStore((s) => s.account);
  const callerD365UserId = useSyncStore((s) => s.callerD365UserId);

  const userIds = [callerD365UserId, account?.localAccountId].filter(
    (v, i, all): v is string => Boolean(v) && all.indexOf(v) === i,
  );
  const resolved: ReportScope | null =
    scope === 'team' ? { kind: 'team', region } : userIds.length > 0 ? { kind: 'mine', userIds } : null;

  return { scope: resolved, key: `${scope}|${region}|${periodKey(period)}|${userIds.join(',')}` };
}
