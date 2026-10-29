import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReportFilters } from '@/components/reports/ReportControls';
import type { BreakdownRow, Forecast, Money, QuietDeal } from '@/types/reports';
import { PipelineTab } from '../PipelineTab';

const q = vi.hoisted(() => ({
  queryOpenPipeline: vi.fn(),
  queryAvgDealSize: vi.fn(),
  queryClosedDeals: vi.fn(),
  queryPipelineByStage: vi.fn(),
  queryPipelineByDimension: vi.fn(),
  queryForecastByMonth: vi.fn(),
  queryQuietDeals: vi.fn(),
}));
vi.mock('@/lib/db/queries/reports/deals', () => q);
const scopeIds = vi.hoisted(() => ({ d365: 'd1' as string | null, msal: 'u1' as string | null }));
vi.mock('@/store/authStore', () => ({
  useAuthStore: (sel: (s: unknown) => unknown) => sel({ account: scopeIds.msal ? { localAccountId: scopeIds.msal } : null }),
}));
vi.mock('@/store/syncStore', () => ({ useSyncStore: (sel: (s: unknown) => unknown) => sel({ callerD365UserId: scopeIds.d365 }) }));

class RO { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal('ResizeObserver', RO);

const team: ReportFilters = { scope: 'team', region: 'BENELUX', period: { kind: 'rolling', months: 12 } };
const money = (count: number, value: number, excludedNonEur = 0): Money => ({ count, value, excludedNonEur });
const row = (label: string, value: number, count = 1): BreakdownRow => ({ label, value, count, excludedNonEur: 0 });

interface Data {
  open: Money & { weighted: number };
  avg: number | null;
  closed: { won: Money; lost: Money; winRatePct: number | null };
  byStage: BreakdownRow[];
  byVendor: BreakdownRow[];
  bySellType: BreakdownRow[];
  forecast: Forecast;
  quiet: QuietDeal[];
}

const quietDeal = (over: Partial<QuietDeal> = {}): QuietDeal => ({
  id: 'o1',
  subject: 'AWS resell lead',
  customerId: 'c1',
  customerName: 'Atos Belgium BV',
  stage: 'Validated',
  value: 120_000,
  currency: 'EUR',
  lastActivityAt: '2026-08-01T10:00:00.000Z',
  daysStale: 62,
  ...over,
});

const base = (): Data => ({
  open: { ...money(12, 900_000), weighted: 260_000 },
  avg: 75_000,
  closed: { won: money(3, 90_000), lost: money(1, 10_000), winRatePct: 90 },
  byStage: [row('Qualified', 500_000, 7), row('Validated', 400_000, 5)],
  byVendor: [row('AWS', 600_000, 8), row('Azure', 300_000, 4)],
  bySellType: [row('New', 700_000, 9), row('Renewal', 200_000, 3)],
  forecast: { buckets: [{ month: 'overdue', value: 50_000 }, { month: '2026-11', value: 300_000 }], noCloseDateCount: 0, noCloseDateValue: 0, excludedNonEur: 0 },
  quiet: [quietDeal()],
});

function load(d: Data) {
  q.queryOpenPipeline.mockResolvedValue(d.open);
  q.queryAvgDealSize.mockResolvedValue(d.avg);
  q.queryClosedDeals.mockResolvedValue(d.closed);
  q.queryPipelineByStage.mockResolvedValue(d.byStage);
  q.queryPipelineByDimension.mockImplementation((_s: unknown, dim: 'vendor' | 'sellType') =>
    Promise.resolve(dim === 'vendor' ? d.byVendor : d.bySellType),
  );
  q.queryForecastByMonth.mockResolvedValue(d.forecast);
  q.queryQuietDeals.mockResolvedValue(d.quiet);
}

const tile = (label: string) => screen.getByText(label).parentElement as HTMLElement;

async function show(d: Data, filters = team) {
  load(d);
  render(<PipelineTab filters={filters} />);
  await screen.findByText('Open pipeline');
}

beforeEach(() => vi.clearAllMocks());

describe('PipelineTab', () => {
  it('labels the forecast as stage-weighted', async () => {
    await show(base());
    expect(screen.getByText(/stage-weighted/i)).toBeInTheDocument();
  });

  it('shows overdue deals in their own bucket, not folded into a past month', async () => {
    await show(base());
    expect(screen.getByText(/Overdue/i)).toBeInTheDocument();
  });

  it('notes excluded non-euro deals when there are any', async () => {
    const d = base();
    d.open = { ...money(12, 900_000, 2), weighted: 260_000 };
    await show(d);
    expect(screen.getByText(/2 deals in other currencies excluded/i)).toBeInTheDocument();
  });

  it('hides the currency note when every deal is in euros', async () => {
    await show(base());
    expect(screen.queryByText(/excluded/i)).not.toBeInTheDocument();
  });

  it('renders no funnel conversion or velocity figure', async () => {
    await show(base());
    expect(screen.queryByText(/conversion/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/velocity|days in stage/i)).not.toBeInTheDocument();
  });

  it('names each stage and its value as readable text, not only as a chart axis', async () => {
    await show(base());
    const stages = within(screen.getByRole('list', { name: 'Pipeline by stage' }));
    expect(stages.getByText('Qualified')).toBeInTheDocument();
    expect(stages.getByText('€500K')).toBeInTheDocument();
  });

  it('switches the breakdown between vendor and sell type', async () => {
    await show(base());
    const breakdown = () => within(screen.getByRole('list', { name: 'Pipeline by vendor' }));
    expect(breakdown().getByText('AWS')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sell type' }));
    expect(within(screen.getByRole('list', { name: 'Pipeline by sell type' })).getByText('Renewal')).toBeInTheDocument();
  });

  it('shows the four pipeline tiles', async () => {
    await show(base());
    for (const l of ['Open pipeline', 'Weighted forecast', 'Average deal size', 'Win rate']) {
      expect(screen.getByText(l)).toBeInTheDocument();
    }
    expect(within(tile('Open pipeline')).getByText(/12 · €900K/)).toBeInTheDocument();
    expect(within(tile('Weighted forecast')).getByText('€260K')).toBeInTheDocument();
    expect(within(tile('Win rate')).getByText('90%')).toBeInTheDocument();
  });

  it('names the user as the population under Mine, never the team', async () => {
    await show(base(), { ...team, scope: 'mine' });
    expect(within(tile('Open pipeline')).getByText(/your deals/i)).toBeInTheDocument();
    expect(screen.queryByText(/Cloud Belux team/i)).not.toBeInTheDocument();
  });

  it('shows a dash rather than a zero when no open deal carries a value', async () => {
    const d = base();
    d.avg = null;
    await show(d);
    expect(within(tile('Average deal size')).getByText(/no deal value recorded/i)).toBeInTheDocument();
    expect(within(tile('Average deal size')).queryByText('€0')).not.toBeInTheDocument();
  });

  it('shows a dash rather than 0% when nothing closed in the period', async () => {
    const d = base();
    d.closed = { won: money(0, 0), lost: money(0, 0), winRatePct: null };
    await show(d);
    expect(within(tile('Win rate')).getByText(/none closed/i)).toBeInTheDocument();
    expect(within(tile('Win rate')).queryByText('0%')).not.toBeInTheDocument();
  });

  it('renders a quiet deal with no value recorded as a dash, never €0', async () => {
    const d = base();
    d.quiet = [quietDeal({ value: null })];
    await show(d);
    const deal = screen.getByText('AWS resell lead').closest('li') as HTMLElement;
    expect(within(deal).getByText('—')).toBeInTheDocument();
    expect(within(deal).queryByText('€0')).not.toBeInTheDocument();
  });

  it('counts undated deals apart rather than dropping them from the forecast', async () => {
    const d = base();
    d.forecast = { ...d.forecast, noCloseDateCount: 3, noCloseDateValue: 45_000 };
    await show(d);
    expect(screen.getByText(/3 deals have no expected close date/i)).toBeInTheDocument();
  });

  it('shows an empty state instead of an empty chart when nothing is open', async () => {
    const d = base();
    d.open = { ...money(0, 0), weighted: 0 };
    d.byStage = [];
    d.byVendor = [];
    d.bySellType = [];
    d.forecast = { buckets: [], noCloseDateCount: 0, noCloseDateValue: 0, excludedNonEur: 0 };
    d.quiet = [];
    await show(d);
    expect(within(tile('Open pipeline')).getByText(/no open deals/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no open deals in this scope/i).length).toBeGreaterThan(0);
  });

  it('renders a non-euro quiet deal in its own currency, never behind a euro sign', async () => {
    const d = base();
    d.quiet = [quietDeal({ value: 250_000, currency: 'USD' })];
    await show(d);
    const deal = screen.getByText('AWS resell lead').closest('li') as HTMLElement;
    expect(within(deal).getByText(/\$250,000|USD 250,000/)).toBeInTheDocument();
    expect(within(deal).queryByText(/€/)).not.toBeInTheDocument();
  });

  it('counts closed non-euro deals in the currency note, not only open ones', async () => {
    const d = base();
    d.closed = { won: money(3, 90_000), lost: money(1, 10_000, 2), winRatePct: 90 };
    await show(d);
    expect(screen.getByText(/2 deals in other currencies excluded/i)).toBeInTheDocument();
  });

  it('says the win rate is by value, so it cannot be mistaken for a count', async () => {
    await show(base());
    expect(within(tile('Win rate')).getByText(/by value/i)).toBeInTheDocument();
  });

  it('says the average covers open deals only', async () => {
    await show(base());
    expect(within(tile('Average deal size')).getByText(/open deals/i)).toBeInTheDocument();
  });

  it('waits rather than reporting an empty pipeline before the user id resolves', async () => {
    load(base());
    scopeIds.d365 = null;
    scopeIds.msal = null;
    render(<PipelineTab filters={{ ...team, scope: 'mine' }} />);
    expect(await screen.findByText(/Loading pipeline figures/i)).toBeInTheDocument();
    expect(screen.queryByText('No open deals')).not.toBeInTheDocument();
    scopeIds.d365 = 'd1';
    scopeIds.msal = 'u1';
  });

  it('labels the snapshot tiles as point-in-time', async () => {
    await show(base());
    expect(screen.getAllByText(/point in time/i).length).toBeGreaterThan(0);
  });
});
