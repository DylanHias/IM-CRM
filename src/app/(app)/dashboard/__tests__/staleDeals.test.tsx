import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/utils/offlineUtils', async (orig) => ({ ...(await orig<object>()), isTauriApp: () => true }));
vi.mock('@/lib/easterEggs', () => ({ isEasterEggsEnabled: () => true }));

const stale = (id: string, subject: string, daysStale: number | null) => ({
  id, subject, customerId: 'c1', customerName: 'Acme', stage: 'Proposal',
  estimatedRevenue: 1000, currency: 'EUR', lastActivityAt: daysStale === null ? null : '2026-01-01T00:00:00.000Z', daysStale,
});

vi.mock('@/lib/db/queries/analytics', () => ({
  queryMyPipeline: async () => ({ openValue: 0 }),
  queryMyPipelineWeeklyDelta: async () => ({ previousValue: 0 }),
  queryMyWinRateSince: async () => ({ won: 0, lost: 0 }),
  queryMyPipelineByStage: async () => [],
  queryMyLifetimeArr: async () => 0,
}));
vi.mock('@/lib/db/queries/followups', () => ({ queryFollowUpsByUser: async () => [] }));
vi.mock('@/lib/db/queries/activities', () => ({ queryMyRecentActivitiesLatest: async () => [] }));
vi.mock('@/lib/db/queries/opportunities', () => ({
  queryMyStaleOpportunities: async () => [stale('o1', 'Never called', null), stale('o2', 'Gone cold', 120), stale('o3', 'Slowing', 45)],
}));

import { useAuthStore } from '@/store/authStore';
import DashboardPage from '../page';

const cobweb = (subject: string) => screen.getByText(subject).closest('li')?.querySelector('svg path[d="M0 0 L40 40"]');

describe('Home: Deals going quiet', () => {
  it('labels a never-contacted deal and gives it the cobweb, alongside stale and merely slow deals', async () => {
    useAuthStore.setState({ account: { localAccountId: 'u1' } } as never);
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('Never called')).toBeInTheDocument());
    expect(screen.getByText('Never contacted')).toBeInTheDocument();
    expect(screen.getByText('120 days')).toBeInTheDocument();
    expect(screen.getByText('45 days')).toBeInTheDocument();
    expect(cobweb('Never called')).toBeTruthy();
    expect(cobweb('Gone cold')).toBeTruthy();
    expect(cobweb('Slowing')).toBeFalsy();
    expect(screen.getByText('30+ days without contact')).toBeInTheDocument();
  });
});
