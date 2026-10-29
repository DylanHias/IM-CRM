'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bar, BarChart, Cell, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MetricStrip } from '@/components/ui/metric-strip';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/empty-state';
import { CompactPager } from '@/components/ui/compact-pager';
import { Segmented } from '@/components/ui/segmented';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarRows } from '@/components/reports/BarRows';
import { ReportTile } from '@/components/reports/ReportTile';
import type { ReportFilters } from '@/components/reports/ReportControls';
import { usePagedRows } from '@/hooks/usePagedRows';
import { useReportScope } from '@/hooks/useReportScope';
import {
  queryAvgDealSize,
  queryClosedDeals,
  queryForecastByMonth,
  queryOpenPipeline,
  queryPipelineByDimension,
  queryPipelineByStage,
  queryQuietDeals,
} from '@/lib/db/queries/reports/deals';
import { forecastSeries, topWithOther } from '@/lib/reports/pipelineShape';
import { formatCurrency, formatEurCompact } from '@/lib/utils/currencyUtils';
import type { BreakdownRow, Forecast, Money, QuietDeal } from '@/types/reports';

type Closed = Awaited<ReturnType<typeof queryClosedDeals>>;
type Dimension = 'vendor' | 'sellType';

interface Data {
  key: string;
  open: Money & { weighted: number };
  avg: number | null;
  closed: Closed;
  byStage: BreakdownRow[];
  byVendor: BreakdownRow[];
  bySellType: BreakdownRow[];
  forecast: Forecast;
  quiet: QuietDeal[];
}

interface Props {
  filters: ReportFilters;
}

const QUIET_DAYS = 30;
const QUIET_LIMIT = 200;
const QUIET_ROW_HEIGHT = 44;
const BREAKDOWN_ROWS = 8;
const TEAM_CAPTION = 'Cloud Belux team';
const SNAPSHOT = 'point in time';

const fmtEur = formatEurCompact;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const monthLabel = (m: string) => new Date(`${m}-01T00:00:00`).toLocaleString('en-GB', { month: 'short', year: '2-digit' });
const dayLabel = (d: number | null) => (d === null ? 'never contacted' : `${d}d quiet`);

const PRIMARY = 'hsl(var(--primary))';
const WARNING = 'hsl(var(--warning))';

const valueConfig = { value: { label: 'Open pipeline', color: PRIMARY } } satisfies ChartConfig;

function usePipelineData(filters: ReportFilters) {
  const { scope, key } = useReportScope(filters);
  const { period } = filters;
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!scope) return;
    let stale = false;
    const load = async () => {
      setFailed(false);
      try {
        const [open, avg, closed, byStage, byVendor, bySellType, forecast, quiet] = await Promise.all([
          queryOpenPipeline(scope),
          queryAvgDealSize(scope),
          queryClosedDeals(scope, period),
          queryPipelineByStage(scope),
          queryPipelineByDimension(scope, 'vendor'),
          queryPipelineByDimension(scope, 'sellType'),
          queryForecastByMonth(scope),
          queryQuietDeals(scope, QUIET_DAYS, QUIET_LIMIT),
        ]);
        if (!stale) setData({ key, open, avg, closed, byStage, byVendor, bySellType, forecast, quiet });
      } catch (err) {
        console.error('[data] Pipeline tab failed to load:', err);
        if (!stale) setFailed(true);
      }
    };
    load();
    return () => {
      stale = true;
    };
    // key stands in for the scope and period so a re-created but equal period does not reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data: data?.key === key ? data : null, failed };
}

function Note({ children }: { children: string }) {
  return <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">{children}</p>;
}

function ChartBox({ children }: { children: ReactNode }) {
  return <div className="min-h-[170px] min-w-0 p-2 lg:min-h-0">{children}</div>;
}

/** Horizontal bars as plain rows, so long vendor and stage names stay readable at any panel height. */
function Breakdown({ rows, label }: { rows: BreakdownRow[]; label: string }) {
  return (
    <BarRows
      label={label}
      format={fmtEur}
      rows={rows.map((r) => ({ label: r.label, value: r.value, sub: plural(r.count, 'deal', 'deals') }))}
    />
  );
}

export function PipelineTab({ filters }: Props) {
  const { data, failed } = usePipelineData(filters);
  const [dimension, setDimension] = useState<Dimension>('vendor');
  const quiet = usePagedRows(data?.quiet ?? [], QUIET_ROW_HEIGHT);

  const stageRows = useMemo(() => topWithOther(data?.byStage ?? [], BREAKDOWN_ROWS), [data?.byStage]);
  const dimensionRows = useMemo(
    () => topWithOther((dimension === 'vendor' ? data?.byVendor : data?.bySellType) ?? [], BREAKDOWN_ROWS),
    [data?.byVendor, data?.bySellType, dimension],
  );
  const forecast = useMemo(() => forecastSeries(data?.forecast.buckets ?? []), [data?.forecast.buckets]);

  if (failed || !data) {
    return (
      <Panel className="grid lg:min-h-0 lg:flex-1 place-items-center">
        {failed ? (
          <EmptyState title="Couldn't load the pipeline figures" description="Try switching tab or reopening Reports." />
        ) : (
          <EmptyState title="Loading pipeline figures" />
        )}
      </Panel>
    );
  }

  const { open, avg, closed } = data;
  const deals = filters.scope === 'mine' ? 'your deals' : TEAM_CAPTION;
  const anyOpen = open.count > 0;
  const empty = 'No open deals in this scope';
  const excludedNonEur = open.excludedNonEur + closed.won.excludedNonEur + closed.lost.excludedNonEur;
  const panel = 'grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]';
  const forecastBars = [
    ...(forecast.overdue === null ? [] : [{ label: 'Overdue', value: forecast.overdue, overdue: true }]),
    ...forecast.months.map((m) => ({ label: monthLabel(m.month), value: m.value, overdue: false })),
  ];

  return (
    <>
      <MetricStrip>
        {anyOpen ? (
          <ReportTile label="Open pipeline" value={`${open.count} · ${fmtEur(open.value)}`} caption={`${deals} · ${SNAPSHOT}`} />
        ) : (
          <ReportTile label="Open pipeline" empty="No open deals" caption={`${deals} · ${SNAPSHOT}`} />
        )}
        {anyOpen ? (
          <ReportTile label="Weighted forecast" value={fmtEur(open.weighted)} caption={`stage-weighted · ${SNAPSHOT}`} />
        ) : (
          <ReportTile label="Weighted forecast" empty="No open deals" caption={`stage-weighted · ${SNAPSHOT}`} />
        )}
        {avg === null ? (
          <ReportTile label="Average deal size" empty="No deal value recorded" caption={`open deals · ${SNAPSHOT}`} />
        ) : (
          <ReportTile label="Average deal size" value={fmtEur(avg)} caption={`open deals · ${SNAPSHOT}`} />
        )}
        {closed.winRatePct === null ? (
          <ReportTile label="Win rate" empty="None closed" caption={`${deals} · by value · this period`} />
        ) : (
          <ReportTile label="Win rate" value={`${Math.round(closed.winRatePct)}%`} caption={`${deals} · by value · this period`} />
        )}
      </MetricStrip>

      {excludedNonEur > 0 && (
        <p className="text-xs text-muted-foreground">
          {plural(excludedNonEur, 'deal', 'deals')} in other currencies excluded from the money figures above (no exchange rate available). Deals going quiet lists every open deal, whatever its currency.
        </p>
      )}

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel className={panel}>
          <PanelHeader title="Pipeline by stage" sub={anyOpen ? `${plural(open.count, 'deal', 'deals')} · ${fmtEur(open.value)}` : undefined} />
          {stageRows.length === 0 ? <EmptyState title={empty} className="self-center" /> : <Breakdown rows={stageRows} label="Pipeline by stage" />}
          <span />
        </Panel>

        <Panel className={panel}>
          <PanelHeader title="Expected close by month" sub="Overdue deals kept apart" />
          {forecastBars.length === 0 ? (
            <EmptyState title={empty} className="self-center" />
          ) : (
            <ChartBox>
              <ChartContainer config={valueConfig} className="aspect-auto h-full w-full">
                <BarChart data={forecastBars} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(v) => fmtEur(Number(v))} />
                  <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(_v, _n, item) => `${item.payload.label}: ${fmtEur(item.payload.value)}`} />} />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {forecastBars.map((b) => (
                      <Cell key={b.label} fill={b.overdue ? WARNING : PRIMARY} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </ChartBox>
          )}
          {data.forecast.noCloseDateCount > 0 ? (
            <Note>{`${plural(data.forecast.noCloseDateCount, 'deal has', 'deals have')} no expected close date (${fmtEur(data.forecast.noCloseDateValue)}), so ${data.forecast.noCloseDateCount === 1 ? 'it is' : 'they are'} not in the bars above.`}</Note>
          ) : (
            <span />
          )}
        </Panel>

        <Panel className={panel}>
          <PanelHeader title="Pipeline by vendor and sell type">
            <Segmented<Dimension>
              aria-label="Breakdown"
              value={dimension}
              onChange={setDimension}
              options={[
                { value: 'vendor', label: 'Vendor' },
                { value: 'sellType', label: 'Sell type' },
              ]}
            />
          </PanelHeader>
          {dimensionRows.length === 0 ? <EmptyState title={empty} className="self-center" /> : <Breakdown rows={dimensionRows} label={dimension === 'vendor' ? 'Pipeline by vendor' : 'Pipeline by sell type'} />}
          <span />
        </Panel>

        <Panel className={panel}>
          <PanelHeader title="Deals going quiet" sub={`No contact with the account for ${QUIET_DAYS}+ days`} />
          {data.quiet.length === 0 ? (
            <EmptyState title={anyOpen ? 'Every open deal has had recent contact' : empty} className="self-center" />
          ) : (
            <ul ref={quiet.ref} className="max-h-72 min-h-0 overflow-y-auto lg:max-h-none">
              {quiet.visible.map((d) => (
                <li key={d.id} className="flex items-center gap-2 border-b border-border px-3 last:border-b-0" style={{ height: QUIET_ROW_HEIGHT }}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium">{d.subject}</div>
                    <div className="truncate text-[11.5px] text-muted-foreground">{`${d.customerName} · ${d.stage}`}</div>
                  </div>
                  <span className="whitespace-nowrap text-[12.5px] font-semibold tabular-nums">{d.value === null ? '—' : d.currency === 'EUR' ? fmtEur(d.value) : formatCurrency(d.value, d.currency)}</span>
                  <span className="w-24 whitespace-nowrap text-right text-[11.5px] text-muted-foreground">{dayLabel(d.daysStale)}</span>
                </li>
              ))}
            </ul>
          )}
          <CompactPager page={quiet.page} pageSize={quiet.pageSize} total={data.quiet.length} onPageChange={quiet.setPage} />
        </Panel>
      </div>
    </>
  );
}
