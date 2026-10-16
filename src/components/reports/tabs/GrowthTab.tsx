'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bar, BarChart, Cell, ComposedChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MetricStrip } from '@/components/ui/metric-strip';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/empty-state';
import { CompactPager } from '@/components/ui/compact-pager';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { ReportTile } from '@/components/reports/ReportTile';
import type { ReportFilters } from '@/components/reports/ReportControls';
import { usePagedRows } from '@/hooks/usePagedRows';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { queryArrMovement, queryArrMovers, queryArrToday } from '@/lib/db/queries/reports/arr';
import { queryClosedDeals, queryNewOpportunities } from '@/lib/db/queries/reports/deals';
import type { ReportScope } from '@/lib/reports/scope';
import type { Region } from '@/lib/revenue/region';
import type { ArrMovement, ArrMover, ArrToday } from '@/types/reports';

type NewOpps = Awaited<ReturnType<typeof queryNewOpportunities>>;
type Closed = Awaited<ReturnType<typeof queryClosedDeals>>;

interface Data {
  today: ArrToday;
  movement: ArrMovement;
  movers: ArrMover[];
  newOpps: NewOpps;
  closed: Closed;
}

interface Props {
  filters: ReportFilters;
}

const MOVER_ROW_HEIGHT = 40;
const MOVER_LIMIT = 200;
const TEAM_CAPTION = 'Cloud Belux team';
const ACCOUNTS: Record<Region, string> = {
  BENELUX: 'all Benelux accounts',
  BE: 'Belgian accounts',
  NL: 'Dutch accounts',
  LU: 'Luxembourg accounts',
};

const fmtEur = (n: number) =>
  n >= 1_000_000 ? `€${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `€${Math.round(n / 1_000)}K` : `€${Math.round(n)}`;
const signed = (n: number) => (n === 0 ? fmtEur(0) : `${n > 0 ? '+' : '−'}${fmtEur(Math.abs(n))}`);
const monthLabel = (m: string) => new Date(`${m}-01T00:00:00`).toLocaleString('en-GB', { month: 'short', year: '2-digit' });
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const hasMovement = (m: ArrMovement) => m.newSale !== 0 || m.upgrade !== 0 || m.downgrade !== 0 || m.cancellation !== 0;

const POSITIVE = 'hsl(var(--success))';
const NEGATIVE = 'hsl(var(--destructive))';
const NEUTRAL = 'hsl(var(--primary))';

const oppsConfig = { count: { label: 'Created', color: NEUTRAL } } satisfies ChartConfig;
const closedConfig = {
  won: { label: 'Won', color: POSITIVE },
  lost: { label: 'Lost', color: NEGATIVE },
  winRate: { label: 'Win rate', color: NEUTRAL },
} satisfies ChartConfig;
const waterfallConfig = { range: { label: 'ARR movement', color: NEUTRAL } } satisfies ChartConfig;

/** Floating bars: each step runs from the running total to the new total, so bars that cross zero stay correct. */
function waterfallSteps(m: ArrMovement) {
  const afterSale = m.newSale;
  const afterUpgrade = afterSale + m.upgrade;
  const afterDowngrade = afterUpgrade - m.downgrade;
  const afterCancel = afterDowngrade - m.cancellation;
  return [
    { name: 'New sale', amount: m.newSale, range: [0, afterSale], fill: POSITIVE },
    { name: 'Upgrade', amount: m.upgrade, range: [afterSale, afterUpgrade], fill: POSITIVE },
    { name: 'Downgrade', amount: -m.downgrade, range: [afterDowngrade, afterUpgrade], fill: NEGATIVE },
    { name: 'Cancellation', amount: -m.cancellation, range: [afterCancel, afterDowngrade], fill: NEGATIVE },
    { name: 'Net', amount: m.net, range: [Math.min(0, m.net), Math.max(0, m.net)], fill: NEUTRAL },
  ];
}

function useGrowthData({ scope, region, period }: ReportFilters) {
  const account = useAuthStore((s) => s.account);
  const callerD365UserId = useSyncStore((s) => s.callerD365UserId);
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  const periodKey = JSON.stringify(period);

  useEffect(() => {
    const userId = callerD365UserId ?? account?.localAccountId ?? null;
    const alt = account?.localAccountId && account.localAccountId !== userId ? account.localAccountId : null;
    const reportScope: ReportScope =
      scope === 'mine' ? { kind: 'mine', userIds: [userId, alt].filter((v): v is string => Boolean(v)) } : { kind: 'team', region };
    let stale = false;
    const load = async () => {
      setFailed(false);
      try {
        const [today, movement, movers, newOpps, closed] = await Promise.all([
          queryArrToday(reportScope),
          queryArrMovement(reportScope, period),
          queryArrMovers(reportScope, period, MOVER_LIMIT),
          queryNewOpportunities(reportScope, period),
          queryClosedDeals(reportScope, period),
        ]);
        if (!stale) setData({ today, movement, movers, newOpps, closed });
      } catch (err) {
        console.error('[data] Growth tab failed to load:', err);
        if (!stale) setFailed(true);
      }
    };
    load();
    return () => {
      stale = true;
    };
    // period is tracked through periodKey so a re-created but equal period does not reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, region, periodKey, account?.localAccountId, callerD365UserId]);

  return { data, failed };
}

function Note({ children }: { children: string }) {
  return <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">{children}</p>;
}

function ChartBox({ children }: { children: ReactNode }) {
  return <div className="min-h-[170px] min-w-0 p-2 lg:min-h-0">{children}</div>;
}

export function GrowthTab({ filters }: Props) {
  const { data, failed } = useGrowthData(filters);
  const movers = usePagedRows(data?.movers ?? [], MOVER_ROW_HEIGHT);
  const steps = useMemo(() => (data ? waterfallSteps(data.movement) : []), [data]);

  if (failed || !data) {
    return (
      <Panel className="grid lg:min-h-0 lg:flex-1 place-items-center">
        {failed ? (
          <EmptyState title="Couldn't load the growth figures" description="Try switching tab or reopening Reports." />
        ) : (
          <EmptyState title="Loading growth figures" />
        )}
      </Panel>
    );
  }

  const { today, movement, newOpps, closed } = data;
  const accounts = filters.scope === 'mine' ? 'your accounts' : ACCOUNTS[filters.region];
  const moved = hasMovement(movement);
  const closedAny = closed.won.count + closed.lost.count > 0;
  const closedExcluded = closed.won.excludedNonEur + closed.lost.excludedNonEur;
  const winRate = closed.winRatePct == null ? '—' : `${Math.round(closed.winRatePct)}%`;
  const closedMonths = closed.byMonth.map((m) => ({
    month: monthLabel(m.month),
    won: m.won.value,
    lost: m.lost.value,
    winRate: m.won.value + m.lost.value > 0 ? Math.round((m.won.value / (m.won.value + m.lost.value)) * 100) : null,
  }));
  const eurTick = (v: unknown) => fmtEur(Number(v));
  const panel = 'grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]';

  return (
    <>
      <MetricStrip>
        {today.matched === 0 ? (
          <ReportTile label="ARR today" empty="No Power BI match" caption={`${accounts} · point in time`} />
        ) : (
          <ReportTile label="ARR today" value={fmtEur(today.total)} caption={`${accounts} · point in time`} />
        )}
        {moved ? (
          <ReportTile label="Net ARR movement" value={signed(movement.net)} caption={accounts} />
        ) : (
          <ReportTile label="Net ARR movement" empty="No movement" caption={accounts} />
        )}
        {newOpps.total.count === 0 ? (
          <ReportTile label="New opportunities" empty="None created" caption={TEAM_CAPTION} />
        ) : (
          <ReportTile label="New opportunities" value={`${newOpps.total.count} · ${fmtEur(newOpps.total.value)}`} caption={TEAM_CAPTION} />
        )}
        {closed.won.count === 0 ? (
          <ReportTile label="Won" empty="None won" caption={TEAM_CAPTION} />
        ) : (
          <ReportTile label="Won" value={`${closed.won.count} · ${fmtEur(closed.won.value)}`} caption={TEAM_CAPTION} />
        )}
      </MetricStrip>

      {today.unmatched > 0 && (
        <p className="text-xs text-muted-foreground">
          {plural(today.unmatched, 'account', 'accounts')} not matched to Power BI in {accounts}; {today.unmatched === 1 ? 'it adds' : 'they add'} no ARR above.
        </p>
      )}

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel className={panel}>
          <PanelHeader title="Where ARR moved" sub={moved ? `Net ${signed(movement.net)}` : undefined} />
          {moved ? (
            <ChartBox>
              <ChartContainer config={waterfallConfig} className="aspect-auto h-full w-full">
                <BarChart data={steps} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={eurTick} />
                  <ChartTooltip
                    content={<ChartTooltipContent hideLabel formatter={(_v, _n, item) => `${item.payload.name}: ${signed(item.payload.amount)}`} />}
                  />
                  <Bar dataKey="range" radius={2}>
                    {steps.map((s) => (
                      <Cell key={s.name} fill={s.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </ChartBox>
          ) : (
            <EmptyState title="No ARR movement in this period" className="self-center" />
          )}
          {movement.unmatchedBcns > 0 ? (
            <Note>{`Not included: ${plural(movement.unmatchedBcns, 'BCN', 'BCNs')} (net ${signed(movement.unmatchedNet)}) that cannot be tied to one account, counted across all Power BI data, not just this scope.`}</Note>
          ) : (
            <span />
          )}
        </Panel>

        <Panel className={panel}>
          <PanelHeader title="Accounts that grew or shrank" sub="By size of movement" />
          {data.movers.length === 0 ? (
            <EmptyState title="No accounts moved" className="self-center" />
          ) : (
            <ul ref={movers.ref} className="max-h-72 min-h-0 overflow-y-auto lg:max-h-none">
              {movers.visible.map((m) => (
                <li key={m.customerId} className="flex items-center gap-2 border-b border-border px-3 text-[12.5px] last:border-b-0" style={{ height: MOVER_ROW_HEIGHT }}>
                  <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  <span className={m.net >= 0 ? 'font-semibold tabular-nums text-success' : 'font-semibold tabular-nums text-destructive'}>{signed(m.net)}</span>
                </li>
              ))}
            </ul>
          )}
          <CompactPager page={movers.page} pageSize={movers.pageSize} total={data.movers.length} onPageChange={movers.setPage} />
        </Panel>

        <Panel className={panel}>
          <PanelHeader title="New opportunities per month" sub={TEAM_CAPTION} />
          {newOpps.total.count === 0 ? (
            <EmptyState title="No opportunities created in this period" className="self-center" />
          ) : (
            <ChartBox>
              <ChartContainer config={oppsConfig} className="aspect-auto h-full w-full">
                <BarChart data={newOpps.byMonth.map((m) => ({ ...m, month: monthLabel(m.month) }))} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v, _n, item) => `${v} created · ${fmtEur(item.payload.value)}`} />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </ChartBox>
          )}
          {newOpps.total.excludedNonEur > 0 ? (
            <Note>{`${plural(newOpps.total.excludedNonEur, 'non-EUR deal', 'non-EUR deals')} excluded (no exchange rate available).`}</Note>
          ) : (
            <span />
          )}
        </Panel>

        <Panel className={panel}>
          <PanelHeader title="Won vs lost per month" sub={`Win rate ${winRate}`} />
          {!closedAny ? (
            <EmptyState title="No deals closed in this period" className="self-center" />
          ) : (
            <ChartBox>
              <ChartContainer config={closedConfig} className="aspect-auto h-full w-full">
                <ComposedChart data={closedMonths} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis yAxisId="eur" tickLine={false} axisLine={false} width={52} tickFormatter={eurTick} />
                  <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tickLine={false} axisLine={false} width={36} tickFormatter={(v) => `${v}%`} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v, n) => (n === 'winRate' ? `Win rate ${v}%` : `${n === 'won' ? 'Won' : 'Lost'} ${fmtEur(Number(v))}`)} />} />
                  <Bar yAxisId="eur" dataKey="won" fill="var(--color-won)" radius={[3, 3, 0, 0]} />
                  <Bar yAxisId="eur" dataKey="lost" fill="var(--color-lost)" radius={[3, 3, 0, 0]} />
                  <Line yAxisId="pct" dataKey="winRate" stroke="var(--color-winRate)" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                </ComposedChart>
              </ChartContainer>
            </ChartBox>
          )}
          {closedExcluded > 0 ? (
            <Note>{`${plural(closedExcluded, 'non-EUR deal', 'non-EUR deals')} excluded (no exchange rate available).`}</Note>
          ) : (
            <span />
          )}
        </Panel>
      </div>
    </>
  );
}
