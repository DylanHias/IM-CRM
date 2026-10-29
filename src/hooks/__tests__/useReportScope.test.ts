import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useReportScope } from '../useReportScope';
import type { ReportFilters } from '@/components/reports/ReportControls';

const ids = vi.hoisted(() => ({ d365: 'd1' as string | null, msal: 'u1' as string | null }));
vi.mock('@/store/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ account: ids.msal ? { localAccountId: ids.msal } : null }),
}));
vi.mock('@/store/syncStore', () => ({ useSyncStore: (sel: (s: unknown) => unknown) => sel({ callerD365UserId: ids.d365 }) }));

const filters = (over: Partial<ReportFilters> = {}): ReportFilters => ({
  scope: 'team',
  region: 'BENELUX',
  period: { kind: 'rolling', months: 12 },
  ...over,
});

describe('useReportScope', () => {
  it('resolves a team scope from the region', () => {
    const { result } = renderHook(() => useReportScope(filters()));
    expect(result.current.scope).toEqual({ kind: 'team', region: 'BENELUX' });
  });

  it('resolves a mine scope from both user ids', () => {
    const { result } = renderHook(() => useReportScope(filters({ scope: 'mine' })));
    expect(result.current.scope).toEqual({ kind: 'mine', userIds: ['d1', 'u1'] });
  });

  it('withholds a mine scope until a user id is known, rather than matching nothing', () => {
    ids.d365 = null;
    ids.msal = null;
    const { result } = renderHook(() => useReportScope(filters({ scope: 'mine' })));
    expect(result.current.scope).toBeNull();
    ids.d365 = 'd1';
    ids.msal = 'u1';
  });

  it('still resolves a team scope when no user id is known', () => {
    ids.d365 = null;
    ids.msal = null;
    const { result } = renderHook(() => useReportScope(filters()));
    expect(result.current.scope).toEqual({ kind: 'team', region: 'BENELUX' });
    ids.d365 = 'd1';
    ids.msal = 'u1';
  });

  it('keys on scope, region and period so equal filters do not reload', () => {
    const a = renderHook(() => useReportScope(filters()));
    const b = renderHook(() => useReportScope(filters()));
    expect(a.result.current.key).toBe(b.result.current.key);
    const other = renderHook(() => useReportScope(filters({ region: 'BE' })));
    expect(other.result.current.key).not.toBe(a.result.current.key);
  });
});
