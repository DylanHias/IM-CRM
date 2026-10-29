import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReportFilters } from '@/components/reports/ReportControls';
import type { AccountSummary, CoverageBucket, DimensionRow, RankedAccount } from '@/types/reports';
import { AccountsTab } from '../AccountsTab';

const q = vi.hoisted(() => ({
  queryAccountSummary: vi.fn(),
  queryTopConcentration: vi.fn(),
  queryAccountsRanked: vi.fn(),
  queryArrByDimension: vi.fn(),
  queryCoverageBuckets: vi.fn(),
}));
vi.mock('@/lib/db/queries/reports/accounts', () => q);
vi.mock('@/store/authStore', () => ({ useAuthStore: (sel: (s: unknown) => unknown) => sel({ account: { localAccountId: 'u1' } }) }));
vi.mock('@/store/syncStore', () => ({ useSyncStore: (sel: (s: unknown) => unknown) => sel({ callerD365UserId: 'd1' }) }));

class RO { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal('ResizeObserver', RO);

const team: ReportFilters = { scope: 'team', region: 'BENELUX', period: { kind: 'rolling', months: 12 } };

interface Data {
  summary: AccountSummary;
  concentration: number | null;
  ranked: RankedAccount[];
  dimension: DimensionRow[];
  coverage: { bucket: CoverageBucket; count: number }[];
}

const account = (id: string, arr: number | null = 100_000): RankedAccount => ({
  id,
  name: `Account ${id}`,
  arr,
  lastContactAt: '2026-10-01T10:00:00.000Z',
  openDeals: 2,
});
const dim = (label: string, arr: number, accounts = 3, matched = 3): DimensionRow => ({ label, arr, accounts, matched });

const base = (): Data => ({
  summary: { total: 40, withArr: 25, noOpenOpp: 12, notContacted90d: 7, neverContacted: 3 },
  concentration: 62.5,
  ranked: Array.from({ length: 30 }, (_, i) => account(`a${i}`, 100_000 - i * 1_000)),
  dimension: Array.from({ length: 9 }, (_, i) => dim(`Segment ${i}`, 90_000 - i * 1_000)),
  coverage: [
    { bucket: '0-30', count: 10 },
    { bucket: '31-60', count: 8 },
    { bucket: '61-90', count: 6 },
    { bucket: '90+', count: 7 },
    { bucket: 'never', count: 3 },
  ],
});

function load(d: Data) {
  q.queryAccountSummary.mockResolvedValue(d.summary);
  q.queryTopConcentration.mockResolvedValue(d.concentration);
  q.queryAccountsRanked.mockResolvedValue(d.ranked);
  q.queryArrByDimension.mockResolvedValue(d.dimension);
  q.queryCoverageBuckets.mockResolvedValue(d.coverage);
}

const tile = (label: string) => screen.getByText(label).parentElement as HTMLElement;

async function show(d: Data, filters = team) {
  load(d);
  render(<AccountsTab filters={filters} />);
  await screen.findByText('Accounts with ARR');
}

beforeEach(() => vi.clearAllMocks());

describe('AccountsTab', () => {
  it('shows accounts with ARR, concentration, whitespace and quiet accounts', async () => {
    await show(base());
    for (const l of ['Accounts with ARR', 'Top-10 concentration', 'No open opportunity', 'Not contacted in 90 days']) {
      expect(screen.getByText(l)).toBeInTheDocument();
    }
    expect(within(tile('Accounts with ARR')).getByText('25 of 40')).toBeInTheDocument();
    expect(within(tile('Top-10 concentration')).getByText('63%')).toBeInTheDocument();
    expect(within(tile('No open opportunity')).getByText('12')).toBeInTheDocument();
  });

  it('counts never-contacted accounts apart from the 90-day figure', async () => {
    await show(base());
    expect(within(tile('Not contacted in 90 days')).getByText('7')).toBeInTheDocument();
    expect(screen.getByText(/3 never contacted/i)).toBeInTheDocument();
  });

  it('pages the ranked account list instead of scrolling it off', async () => {
    await show(base());
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
  });

  it('adds an "Other" row so the dimension bars reconcile to the total', async () => {
    await show(base());
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('never shows a health score', async () => {
    await show(base());
    expect(screen.queryByText(/health/i)).not.toBeInTheDocument();
  });

  it('shows an unmatched account as no Power BI match, not as zero ARR', async () => {
    const d = base();
    d.ranked = [account('a0', null)];
    await show(d);
    const row = screen.getByText('Account a0').closest('li') as HTMLElement;
    expect(within(row).getByText(/no match/i)).toBeInTheDocument();
    expect(within(row).queryByText('€0')).not.toBeInTheDocument();
  });

  it('shows a dash rather than 0% when no account in scope holds ARR', async () => {
    const d = base();
    d.concentration = null;
    d.summary = { ...d.summary, withArr: 0 };
    await show(d);
    expect(within(tile('Top-10 concentration')).getByText(/no ARR in scope/i)).toBeInTheDocument();
    expect(within(tile('Top-10 concentration')).queryByText('0%')).not.toBeInTheDocument();
  });

  it('buckets accounts by last contact with never-contacted separate', async () => {
    await show(base());
    for (const b of ['0–30', '31–60', '61–90', '90+', 'Never']) expect(screen.getByText(b)).toBeInTheDocument();
  });

  it('names the user as the population under Mine, never the team', async () => {
    await show(base(), { ...team, scope: 'mine' });
    expect(within(tile('Accounts with ARR')).getByText(/your accounts/i)).toBeInTheDocument();
  });

  it('shows an empty state rather than an empty list when no account is in scope', async () => {
    const d = base();
    d.summary = { total: 0, withArr: 0, noOpenOpp: 0, notContacted90d: 0, neverContacted: 0 };
    d.concentration = null;
    d.ranked = [];
    d.dimension = [];
    d.coverage = [];
    await show(d);
    expect(screen.getAllByText(/no accounts in this scope/i).length).toBeGreaterThan(0);
  });
});
