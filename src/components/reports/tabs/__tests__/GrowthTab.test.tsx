import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReportFilters } from '@/components/reports/ReportControls';
import type { ArrMovement, ArrMover, ArrToday, ClosedMonth, MonthTotal, Money } from '@/types/reports';
import { GrowthTab } from '../GrowthTab';

const q = vi.hoisted(() => ({
  queryArrToday: vi.fn(),
  queryArrMovement: vi.fn(),
  queryArrMovers: vi.fn(),
  queryNewOpportunities: vi.fn(),
  queryClosedDeals: vi.fn(),
}));
vi.mock('@/lib/db/queries/reports/arr', () => ({ queryArrToday: q.queryArrToday, queryArrMovement: q.queryArrMovement, queryArrMovers: q.queryArrMovers }));
vi.mock('@/lib/db/queries/reports/deals', () => ({ queryNewOpportunities: q.queryNewOpportunities, queryClosedDeals: q.queryClosedDeals }));
const scopeIds = vi.hoisted(() => ({ d365: 'd1' as string | null, msal: 'u1' as string | null }));
vi.mock('@/store/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ account: scopeIds.msal ? { localAccountId: scopeIds.msal } : null }),
}));
vi.mock('@/store/syncStore', () => ({ useSyncStore: (sel: (s: unknown) => unknown) => sel({ callerD365UserId: scopeIds.d365 }) }));

class RO { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal('ResizeObserver', RO);

const team: ReportFilters = { scope: 'team', region: 'BENELUX', period: { kind: 'rolling', months: 12 } };
const money = (count: number, value: number, excludedNonEur = 0): Money => ({ count, value, excludedNonEur });

interface Data {
  today: ArrToday;
  movement: ArrMovement;
  movers: ArrMover[];
  newOpps: { total: Money; byMonth: MonthTotal[] };
  closed: { won: Money; lost: Money; winRatePct: number | null; byMonth: ClosedMonth[] };
}

const flat: ArrMovement = { newSale: 0, upgrade: 0, downgrade: 0, cancellation: 0, net: 0, unmatchedBcns: 0, unmatchedNet: 0 };
const base = (): Data => ({
  today: { total: 1_200_000, matched: 9, unmatched: 1 },
  movement: { newSale: 50_000, upgrade: 20_000, downgrade: 10_000, cancellation: 5_000, net: 55_000, unmatchedBcns: 3, unmatchedNet: 7_000 },
  movers: [{ customerId: 'c1', name: 'Acme NV', newSale: 50_000, upgrade: 0, downgrade: 0, cancellation: 0, net: 50_000 }],
  newOpps: { total: money(4, 80_000), byMonth: [{ month: '2026-09', count: 4, value: 80_000 }] },
  closed: {
    won: money(2, 30_000),
    lost: money(1, 10_000),
    winRatePct: 75,
    byMonth: [{ month: '2026-09', won: { count: 2, value: 30_000 }, lost: { count: 1, value: 10_000 } }],
  },
});

function load(d: Data) {
  q.queryArrToday.mockResolvedValue(d.today);
  q.queryArrMovement.mockResolvedValue(d.movement);
  q.queryArrMovers.mockResolvedValue(d.movers);
  q.queryNewOpportunities.mockResolvedValue(d.newOpps);
  q.queryClosedDeals.mockResolvedValue(d.closed);
}
const tile = (label: string) => screen.getByText(label).parentElement as HTMLElement;

async function show(d: Data, filters = team) {
  load(d);
  render(<GrowthTab filters={filters} />);
  await screen.findByText('Net ARR movement');
}

beforeEach(() => vi.clearAllMocks());

describe('GrowthTab', () => {
  it('waits rather than reporting no growth before the user id resolves', async () => {
    load(base());
    scopeIds.d365 = null;
    scopeIds.msal = null;
    render(<GrowthTab filters={{ ...team, scope: 'mine' }} />);
    expect(await screen.findByText(/Loading growth figures/i)).toBeInTheDocument();
    expect(screen.queryByText('No movement')).not.toBeInTheDocument();
    scopeIds.d365 = 'd1';
    scopeIds.msal = 'u1';
  });

  it('shows ARR today, net movement, new opportunities and won', async () => {
    await show(base());
    for (const l of ['ARR today', 'Net ARR movement', 'New opportunities', 'Won']) expect(screen.getByText(l)).toBeInTheDocument();
    expect(screen.getByText('€1.20M')).toBeInTheDocument();
    expect(screen.getByText('+€55K')).toBeInTheDocument();
  });

  it('captions each tile with its own population', async () => {
    await show(base());
    expect(within(tile('ARR today')).getByText(/all Benelux accounts · point in time/i)).toBeInTheDocument();
    expect(within(tile('Net ARR movement')).getByText(/all Benelux accounts/i)).toBeInTheDocument();
    expect(within(tile('New opportunities')).getByText('Cloud Belux team')).toBeInTheDocument();
    expect(within(tile('Won')).getByText('Cloud Belux team')).toBeInTheDocument();
  });

  it('names the user as the population under Mine, never the team', async () => {
    await show(base(), { ...team, scope: 'mine' });
    expect(within(tile('ARR today')).getByText(/your accounts/i)).toBeInTheDocument();
    expect(within(tile('New opportunities')).getByText('your deals')).toBeInTheDocument();
    expect(within(tile('Won')).getByText('your deals')).toBeInTheDocument();
    expect(screen.queryByText(/Cloud Belux team/i)).not.toBeInTheDocument();
  });

  it('captions a country filter with that country', async () => {
    await show(base(), { ...team, region: 'BE' });
    expect(within(tile('ARR today')).getByText(/Belgian accounts/i)).toBeInTheDocument();
    expect(within(tile('Net ARR movement')).getByText(/Belgian accounts/i)).toBeInTheDocument();
  });

  it('surfaces how many in-scope accounts have no Power BI match', async () => {
    await show(base());
    expect(screen.getByText(/1 account not matched/i)).toBeInTheDocument();
  });

  it('says the unmatched movement is across all Power BI data, never scoped', async () => {
    await show(base(), { ...team, scope: 'mine' });
    const note = screen.getByText(/across all Power BI data/i);
    expect(note).toHaveTextContent(/3 BCNs/);
    expect(note).not.toHaveTextContent(/your/i);
  });

  it('renders an empty state rather than a flat zero chart when the period has no movement', async () => {
    const d = base();
    d.movement = flat;
    d.movers = [];
    await show(d);
    expect(screen.getByText(/No ARR movement in this period/i)).toBeInTheDocument();
    expect(screen.getByText('No movement')).toBeInTheDocument();
    expect(screen.queryByText('€0')).not.toBeInTheDocument();
  });

  it('labels snapshot tiles as point-in-time', async () => {
    await show(base());
    expect(screen.getByText('ARR today')).toBeInTheDocument();
    expect(screen.getAllByText(/point in time/i).length).toBe(1);
  });

  it('shows a dash, not 0%, when nothing closed', async () => {
    const d = base();
    d.closed = { won: money(0, 0), lost: money(0, 0), winRatePct: null, byMonth: [] };
    await show(d);
    expect(screen.getByText(/Win rate —/)).toBeInTheDocument();
    expect(screen.queryByText(/0%/)).not.toBeInTheDocument();
  });

  it('reports excluded non-EUR deals only when there are some', async () => {
    const d = base();
    d.newOpps.total = money(4, 80_000, 2);
    await show(d);
    expect(screen.getByText(/2 non-EUR deals excluded/i)).toBeInTheDocument();
  });

  it('reports excluded non-EUR won/lost deals in the won and lost panel', async () => {
    const d = base();
    d.closed = { ...d.closed, lost: money(1, 10_000, 3) };
    await show(d);
    const panel = screen.getByText('Won vs lost per month').closest('section') as HTMLElement;
    expect(within(panel).getByText(/3 non-EUR deals excluded/i)).toBeInTheDocument();
  });

  it('hides the non-EUR note when none were excluded', async () => {
    await show(base());
    expect(screen.queryByText(/non-EUR/i)).not.toBeInTheDocument();
  });

  it('says there are no accounts in scope instead of blaming Power BI', async () => {
    const d = base();
    d.today = { total: 0, matched: 0, unmatched: 0 };
    await show(d);
    expect(screen.getByText('No accounts in scope')).toBeInTheDocument();
  });

  it('does not show the previous scope figures under the new captions', async () => {
    load(base());
    const { rerender } = render(<GrowthTab filters={team} />);
    await screen.findByText('Net ARR movement');
    let resolve: (v: ArrToday) => void = () => {};
    q.queryArrToday.mockReturnValue(new Promise<ArrToday>((r) => { resolve = r; }));
    rerender(<GrowthTab filters={{ ...team, region: 'BE' }} />);
    expect(screen.queryByText('€1.20M')).not.toBeInTheDocument();
    expect(screen.queryByText(/Belgian accounts/i)).not.toBeInTheDocument();
    resolve({ total: 5_000, matched: 1, unmatched: 0 });
    expect(await screen.findByText('€5K')).toBeInTheDocument();
  });

  it('shows no ARR figure when no account matched Power BI', async () => {
    const d = base();
    d.today = { total: 0, matched: 0, unmatched: 2 };
    await show(d);
    expect(screen.getByText('No Power BI match')).toBeInTheDocument();
  });

  it('reports a failed load instead of zeros', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    q.queryArrToday.mockRejectedValue(new Error('db'));
    q.queryArrMovement.mockResolvedValue(flat);
    q.queryArrMovers.mockResolvedValue([]);
    q.queryNewOpportunities.mockResolvedValue(base().newOpps);
    q.queryClosedDeals.mockResolvedValue(base().closed);
    render(<GrowthTab filters={team} />);
    await waitFor(() => expect(screen.getByText(/Couldn.t load/i)).toBeInTheDocument());
  });
});
