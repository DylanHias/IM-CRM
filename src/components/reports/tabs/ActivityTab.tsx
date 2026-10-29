'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { MetricStrip } from '@/components/ui/metric-strip';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/empty-state';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { BarRows } from '@/components/reports/BarRows';
import { ReportTile } from '@/components/reports/ReportTile';
import type { ReportFilters } from '@/components/reports/ReportControls';
import { useReportScope } from '@/hooks/useReportScope';
import {
  queryAccountsTouched,
  queryActivitiesPerWonDeal,
  queryActivityVolume,
  queryFollowUpCompletion,
} from '@/lib/db/queries/reports/activity';
import { queryCoverageBuckets } from '@/lib/db/queries/reports/accounts';
import type { Region } from '@/lib/revenue/region';
import type { ActivityVolume, CoverageBucket } from '@/types/reports';

interface Data {
  key: string;
  volume: ActivityVolume;
  touched: { touched: number; owned: number };
  followUps: { completed: number; total: number };
  perWon: number | null;
  coverage: { bucket: CoverageBucket; count: number }[];
}

interface Props {
  filters: ReportFilters;
}

const TEAM_CAPTION = 'Cloud Belux team';
const ACCOUNTS: Record<Region, string> = {
  BENELUX: 'all Benelux accounts',
  BE: 'Belgian accounts',
  NL: 'Dutch accounts',
  LU: 'Luxembourg accounts',
};
// These are queryCoverageBuckets' own boundaries: no day falls in two of them.
const COVERAGE_LABEL: Record<CoverageBucket, string> = {
  '0-30': '0–30',
  '31-60': '31–60',
  '61-90': '61–90',
  '90+': '90+',
  never: 'Never',
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const monthLabel = (m: string) => new Date(`${m}-01T00:00:00`).toLocaleString('en-GB', { month: 'short', year: '2-digit' });
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

// Enough hues for the activity types in use; anything beyond falls back to the last one.
const TYPE_COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

function useActivityData(filters: ReportFilters) {
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
        const [volume, touched, followUps, perWon, coverage] = await Promise.all([
          queryActivityVolume(scope, period),
          queryAccountsTouched(scope, period),
          queryFollowUpCompletion(scope, period),
          queryActivitiesPerWonDeal(scope, period),
          queryCoverageBuckets(scope),
        ]);
        if (!stale) setData({ key, volume, touched, followUps, perWon, coverage });
      } catch (err) {
        console.error('[activity] Activity tab failed to load:', err);
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

function ChartBox({ children }: { children: ReactNode }) {
  return <div className="min-h-[170px] min-w-0 p-2 lg:min-h-0">{children}</div>;
}

/** One stacked series per activity type present in the period. */
function stackByType(byMonth: ActivityVolume['byMonth']) {
  const types = Array.from(new Set(byMonth.map((r) => r.type))).sort();
  const months = Array.from(new Set(byMonth.map((r) => r.month))).sort();
  const rows = months.map((month) => {
    const row: Record<string, string | number> = { month: monthLabel(month) };
    for (const type of types) row[type] = byMonth.find((r) => r.month === month && r.type === type)?.count ?? 0;
    return row;
  });
  const config = Object.fromEntries(
    types.map((type, i) => [type, { label: type, color: TYPE_COLORS[Math.min(i, TYPE_COLORS.length - 1)] }]),
  ) satisfies ChartConfig;
  return { types, rows, config };
}

export function ActivityTab({ filters }: Props) {
  const { data, failed } = useActivityData(filters);
  const stack = useMemo(() => stackByType(data?.volume.byMonth ?? []), [data?.volume.byMonth]);

  if (failed || !data) {
    return (
      <Panel className="grid lg:min-h-0 lg:flex-1 place-items-center">
        {failed ? (
          <EmptyState title="Couldn't load the activity figures" description="Try switching tab or reopening Reports." />
        ) : (
          <EmptyState title="Loading activity figures" />
        )}
      </Panel>
    );
  }

  const { volume, touched, followUps, perWon, coverage } = data;
  const activity = filters.scope === 'mine' ? 'your activity' : TEAM_CAPTION;
  const accounts = filters.scope === 'mine' ? 'your accounts' : ACCOUNTS[filters.region];
  const panel = 'grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]';

  return (
    <>
      <MetricStrip>
        {volume.total === 0 ? (
          <ReportTile label="Activities logged" empty="Nothing logged" caption={activity} />
        ) : (
          <ReportTile label="Activities logged" value={`${volume.total}`} caption={`${activity} · ${signed(volume.total - volume.previous)} vs previous`} />
        )}
        {touched.owned === 0 ? (
          <ReportTile label="Accounts touched" empty="No accounts in scope" caption={accounts} />
        ) : (
          <ReportTile label="Accounts touched" value={`${touched.touched} of ${touched.owned}`} caption={accounts} />
        )}
        {followUps.total === 0 ? (
          <ReportTile label="Follow-ups completed" empty="None due" caption={activity} />
        ) : (
          <ReportTile label="Follow-ups completed" value={`${followUps.completed} of ${followUps.total}`} caption={`${activity} · due or completed in this period`} />
        )}
        {perWon === null ? (
          <ReportTile label="Activities per won deal" empty="None won" caption={activity} />
        ) : (
          <ReportTile label="Activities per won deal" value={`${Math.round(perWon)}`} caption={activity} />
        )}
      </MetricStrip>

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel className={panel}>
          <PanelHeader title="Activity over time" sub={volume.total > 0 ? plural(volume.total, 'activity', 'activities') : undefined} />
          {stack.rows.length === 0 ? (
            <EmptyState title="Nothing logged in this period" className="self-center" />
          ) : (
            <ChartBox>
              <ChartContainer config={stack.config} className="aspect-auto h-full w-full">
                <BarChart data={stack.rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent formatter={(v, n) => (v === 0 ? null : `${n} ${v}`)} />} />
                  {stack.types.map((type, i) => (
                    <Bar
                      key={type}
                      dataKey={type}
                      stackId="a"
                      fill={`var(--color-${type})`}
                      radius={i === stack.types.length - 1 ? [3, 3, 0, 0] : undefined}
                    />
                  ))}
                </BarChart>
              </ChartContainer>
            </ChartBox>
          )}
          <span />
        </Panel>

        <Panel className={panel}>
          <PanelHeader title="Coverage" sub="Accounts by days since last contact · point in time" />
          {coverage.every((b) => b.count === 0) ? (
            <EmptyState title="No accounts in this scope" className="self-center" />
          ) : (
            <BarRows
              label="Coverage"
              format={String}
              rows={coverage.map((b) => ({ label: COVERAGE_LABEL[b.bucket], value: b.count, sub: plural(b.count, 'account', 'accounts') }))}
            />
          )}
          <span />
        </Panel>
      </div>
    </>
  );
}
