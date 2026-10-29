import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReportFilters } from '@/components/reports/ReportControls';
import type { ActivityVolume, CoverageBucket } from '@/types/reports';
import { ActivityTab } from '../ActivityTab';

const q = vi.hoisted(() => ({
  queryActivityVolume: vi.fn(),
  queryAccountsTouched: vi.fn(),
  queryFollowUpCompletion: vi.fn(),
  queryActivitiesPerWonDeal: vi.fn(),
  queryCoverageBuckets: vi.fn(),
}));
vi.mock('@/lib/db/queries/reports/activity', () => ({
  queryActivityVolume: q.queryActivityVolume,
  queryAccountsTouched: q.queryAccountsTouched,
  queryFollowUpCompletion: q.queryFollowUpCompletion,
  queryActivitiesPerWonDeal: q.queryActivitiesPerWonDeal,
}));
vi.mock('@/lib/db/queries/reports/accounts', () => ({ queryCoverageBuckets: q.queryCoverageBuckets }));
const scopeIds = vi.hoisted(() => ({ d365: 'd1' as string | null, msal: 'u1' as string | null }));
vi.mock('@/store/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ account: scopeIds.msal ? { localAccountId: scopeIds.msal } : null }),
}));
vi.mock('@/store/syncStore', () => ({ useSyncStore: (sel: (s: unknown) => unknown) => sel({ callerD365UserId: scopeIds.d365 }) }));

class RO { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal('ResizeObserver', RO);

const team: ReportFilters = { scope: 'team', region: 'BENELUX', period: { kind: 'rolling', months: 12 } };

interface Data {
  volume: ActivityVolume;
  touched: { touched: number; owned: number };
  followUps: { completed: number; total: number };
  perWon: number | null;
  coverage: { bucket: CoverageBucket; count: number }[];
}

const base = (): Data => ({
  volume: {
    total: 120,
    previous: 100,
    byMonth: [
      { month: '2026-09', type: 'Meeting', count: 40 },
      { month: '2026-09', type: 'Call', count: 20 },
      { month: '2026-10', type: 'Meeting', count: 60 },
    ],
  },
  touched: { touched: 18, owned: 40 },
  followUps: { completed: 9, total: 12 },
  perWon: 24,
  coverage: [
    { bucket: '0-30', count: 10 },
    { bucket: '31-60', count: 8 },
    { bucket: '61-90', count: 6 },
    { bucket: '90+', count: 7 },
    { bucket: 'never', count: 3 },
  ],
});

function load(d: Data) {
  q.queryActivityVolume.mockResolvedValue(d.volume);
  q.queryAccountsTouched.mockResolvedValue(d.touched);
  q.queryFollowUpCompletion.mockResolvedValue(d.followUps);
  q.queryActivitiesPerWonDeal.mockResolvedValue(d.perWon);
  q.queryCoverageBuckets.mockResolvedValue(d.coverage);
}

const tile = (label: string) => screen.getByText(label).parentElement as HTMLElement;

async function show(d: Data, filters = team) {
  load(d);
  render(<ActivityTab filters={filters} />);
  await screen.findByText('Activities logged');
}

beforeEach(() => vi.clearAllMocks());

describe('ActivityTab', () => {
  it('shows activities logged, accounts touched, follow-ups completed and activities per won deal', async () => {
    await show(base());
    for (const l of ['Activities logged', 'Accounts touched', 'Follow-ups completed', 'Activities per won deal']) {
      expect(screen.getByText(l)).toBeInTheDocument();
    }
    expect(within(tile('Accounts touched')).getByText('18 of 40')).toBeInTheDocument();
    expect(within(tile('Follow-ups completed')).getByText('9 of 12')).toBeInTheDocument();
    expect(within(tile('Activities per won deal')).getByText('24')).toBeInTheDocument();
  });

  it('compares the volume with the previous window of the same length', async () => {
    await show(base());
    expect(within(tile('Activities logged')).getByText(/\+20 vs previous/i)).toBeInTheDocument();
  });

  it('shows a dash rather than a division by zero when nothing was won', async () => {
    const d = base();
    d.perWon = null;
    await show(d);
    expect(within(tile('Activities per won deal')).getByText(/none won/i)).toBeInTheDocument();
    expect(within(tile('Activities per won deal')).queryByText('0')).not.toBeInTheDocument();
  });

  it('buckets accounts by last contact with never-contacted separate', async () => {
    await show(base());
    for (const b of ['0–30', '31–60', '61–90', '90+', 'Never']) expect(screen.getByText(b)).toBeInTheDocument();
  });

  it('names the user as the population under Mine, never the team', async () => {
    await show(base(), { ...team, scope: 'mine' });
    expect(within(tile('Activities logged')).getByText(/your activity/i)).toBeInTheDocument();
    expect(screen.queryByText(/Cloud Belux team/i)).not.toBeInTheDocument();
  });

  it('shows an empty state rather than a flat zero chart when nothing was logged', async () => {
    const d = base();
    d.volume = { total: 0, previous: 0, byMonth: [] };
    await show(d);
    expect(screen.getByText(/nothing logged in this period/i)).toBeInTheDocument();
    expect(within(tile('Activities logged')).getByText(/nothing logged/i)).toBeInTheDocument();
  });

  it('says the coverage breakdown is point-in-time, since the period does not reach it', async () => {
    await show(base());
    expect(screen.getByText(/days since last contact · point in time/i)).toBeInTheDocument();
  });

  it('says there are no accounts rather than drawing five zero bars', async () => {
    const d = base();
    d.coverage = d.coverage.map((b) => ({ ...b, count: 0 }));
    await show(d);
    expect(screen.getByText(/no accounts in this scope/i)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Coverage' })).not.toBeInTheDocument();
  });

  it('waits rather than reporting no activity before the user id resolves', async () => {
    load(base());
    scopeIds.d365 = null;
    scopeIds.msal = null;
    render(<ActivityTab filters={{ ...team, scope: 'mine' }} />);
    expect(await screen.findByText(/Loading activity figures/i)).toBeInTheDocument();
    expect(screen.queryByText('Nothing logged')).not.toBeInTheDocument();
    scopeIds.d365 = 'd1';
    scopeIds.msal = 'u1';
  });

  it('shows a dash rather than 0 of 0 when no follow-up was due', async () => {
    const d = base();
    d.followUps = { completed: 0, total: 0 };
    await show(d);
    expect(within(tile('Follow-ups completed')).getByText(/none due/i)).toBeInTheDocument();
  });
});
