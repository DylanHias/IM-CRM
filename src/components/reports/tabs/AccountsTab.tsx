'use client';

import { useEffect, useMemo, useState } from 'react';
import { MetricStrip } from '@/components/ui/metric-strip';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/empty-state';
import { CompactPager } from '@/components/ui/compact-pager';
import { Segmented } from '@/components/ui/segmented';
import { BarRows } from '@/components/reports/BarRows';
import { ReportTile } from '@/components/reports/ReportTile';
import type { ReportFilters } from '@/components/reports/ReportControls';
import { usePagedRows } from '@/hooks/usePagedRows';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import {
  queryAccountSummary,
  queryAccountsRanked,
  queryArrByDimension,
  queryCoverageBuckets,
  queryTopConcentration,
} from '@/lib/db/queries/reports/accounts';
import { periodKey } from '@/lib/reports/period';
import type { ReportScope } from '@/lib/reports/scope';
import { formatEurCompact } from '@/lib/utils/currencyUtils';
import type { Region } from '@/lib/revenue/region';
import type { AccountSummary, CoverageBucket, DimensionRow, RankedAccount } from '@/types/reports';

type Dimension = 'segment' | 'industry' | 'country';

interface Data {
  key: string;
  summary: AccountSummary;
  concentration: number | null;
  ranked: RankedAccount[];
  dimension: DimensionRow[];
  coverage: { bucket: CoverageBucket; count: number }[];
}

interface Props {
  filters: ReportFilters;
}

const RANKED_LIMIT = 200;
const RANKED_ROW_HEIGHT = 44;
const DIMENSION_ROWS = 8;
const TOP_N = 10;
const ACCOUNTS: Record<Region, string> = {
  BENELUX: 'all Benelux accounts',
  BE: 'Belgian accounts',
  NL: 'Dutch accounts',
  LU: 'Luxembourg accounts',
};
const COVERAGE_LABEL: Record<CoverageBucket, string> = {
  '0-30': '0–30',
  '31-60': '31–60',
  '61-90': '61–90',
  '90+': '90+',
  never: 'Never',
};

const fmtEur = formatEurCompact;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const contactLabel = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : 'never contacted';

/** Largest `max` groups; everything below folds into one "Other" row so the bars still add up to scope ARR. */
function topDimensionsWithOther(rows: DimensionRow[], max: number): DimensionRow[] {
  if (rows.length <= max) return rows;
  const sorted = [...rows].sort((a, b) => b.arr - a.arr);
  const tail = sorted.slice(max - 1);
  return [
    ...sorted.slice(0, max - 1),
    {
      label: 'Other',
      arr: tail.reduce((t, r) => t + r.arr, 0),
      accounts: tail.reduce((t, r) => t + r.accounts, 0),
      matched: tail.reduce((t, r) => t + r.matched, 0),
    },
  ];
}

function useAccountsData({ scope, region, period }: ReportFilters, dimension: Dimension) {
  const account = useAuthStore((s) => s.account);
  const callerD365UserId = useSyncStore((s) => s.callerD365UserId);
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  const key = `${scope}|${region}|${periodKey(period)}|${dimension}`;

  useEffect(() => {
    const userId = callerD365UserId ?? account?.localAccountId ?? null;
    const alt = account?.localAccountId && account.localAccountId !== userId ? account.localAccountId : null;
    const reportScope: ReportScope =
      scope === 'mine' ? { kind: 'mine', userIds: [userId, alt].filter((v): v is string => Boolean(v)) } : { kind: 'team', region };
    let stale = false;
    const load = async () => {
      setFailed(false);
      try {
        const [summary, concentration, ranked, dim, coverage] = await Promise.all([
          queryAccountSummary(reportScope),
          queryTopConcentration(reportScope, TOP_N),
          queryAccountsRanked(reportScope, RANKED_LIMIT, 0),
          queryArrByDimension(reportScope, dimension),
          queryCoverageBuckets(reportScope),
        ]);
        if (!stale) setData({ key, summary, concentration, ranked, dimension: dim, coverage });
      } catch (err) {
        console.error('[customer] Accounts tab failed to load:', err);
        if (!stale) setFailed(true);
      }
    };
    load();
    return () => {
      stale = true;
    };
    // key stands in for scope, region, period and dimension so a re-created but equal period does not reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, account?.localAccountId, callerD365UserId]);

  return { data: data?.key === key ? data : null, failed };
}

function Note({ children }: { children: string }) {
  return <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">{children}</p>;
}

export function AccountsTab({ filters }: Props) {
  const [dimension, setDimension] = useState<Dimension>('segment');
  const { data, failed } = useAccountsData(filters, dimension);
  const ranked = usePagedRows(data?.ranked ?? [], RANKED_ROW_HEIGHT);
  const dimensionRows = useMemo(() => topDimensionsWithOther(data?.dimension ?? [], DIMENSION_ROWS), [data?.dimension]);

  if (failed || !data) {
    return (
      <Panel className="grid lg:min-h-0 lg:flex-1 place-items-center">
        {failed ? (
          <EmptyState title="Couldn't load the account figures" description="Try switching tab or reopening Reports." />
        ) : (
          <EmptyState title="Loading account figures" />
        )}
      </Panel>
    );
  }

  const { summary, concentration, coverage } = data;
  const accounts = filters.scope === 'mine' ? 'your accounts' : ACCOUNTS[filters.region];
  const caption = `${accounts} · point in time`;
  const empty = 'No accounts in this scope';
  const anyAccounts = summary.total > 0;
  const unmatchedInDimension = dimensionRows.reduce((t, r) => t + (r.accounts - r.matched), 0);
  const coverageBars = coverage.map((b) => ({ label: COVERAGE_LABEL[b.bucket], count: b.count }));
  const panel = 'grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]';

  return (
    <>
      <MetricStrip>
        {anyAccounts ? (
          <ReportTile label="Accounts with ARR" value={`${summary.withArr} of ${summary.total}`} caption={caption} />
        ) : (
          <ReportTile label="Accounts with ARR" empty="No accounts in scope" caption={caption} />
        )}
        {concentration === null ? (
          <ReportTile label="Top-10 concentration" empty="No ARR in scope" caption={caption} />
        ) : (
          <ReportTile label="Top-10 concentration" value={`${Math.round(concentration)}%`} caption={`${accounts} · share held by the 10 largest`} />
        )}
        {anyAccounts ? (
          <ReportTile label="No open opportunity" value={`${summary.noOpenOpp}`} caption={caption} />
        ) : (
          <ReportTile label="No open opportunity" empty="No accounts in scope" caption={caption} />
        )}
        {anyAccounts ? (
          <ReportTile label="Not contacted in 90 days" value={`${summary.notContacted90d}`} caption={`${accounts} · ${plural(summary.neverContacted, 'never contacted', 'never contacted')}`} />
        ) : (
          <ReportTile label="Not contacted in 90 days" empty="No accounts in scope" caption={caption} />
        )}
      </MetricStrip>

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel className={`${panel} lg:row-span-2`}>
          <PanelHeader title="Accounts ranked by ARR" sub={anyAccounts ? `${plural(summary.total, 'account', 'accounts')} in scope` : undefined} />
          {data.ranked.length === 0 ? (
            <EmptyState title={empty} className="self-center" />
          ) : (
            <ul ref={ranked.ref} className="max-h-96 min-h-0 overflow-y-auto lg:max-h-none">
              {ranked.visible.map((a) => (
                <li key={a.id} className="flex items-center gap-2 border-b border-border px-3 last:border-b-0" style={{ height: RANKED_ROW_HEIGHT }}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium">{a.name}</div>
                    <div className="truncate text-[11.5px] text-muted-foreground">
                      {`${plural(a.openDeals, 'open deal', 'open deals')} · last contact ${contactLabel(a.lastContactAt)}`}
                    </div>
                  </div>
                  <span className={a.arr === null ? 'whitespace-nowrap text-[11.5px] text-muted-foreground' : 'whitespace-nowrap text-[12.5px] font-semibold tabular-nums'}>
                    {a.arr === null ? 'No match' : fmtEur(a.arr)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <CompactPager page={ranked.page} pageSize={ranked.pageSize} total={data.ranked.length} onPageChange={ranked.setPage} />
        </Panel>

        <Panel className={panel}>
          <PanelHeader title="ARR by dimension">
            <Segmented<Dimension>
              aria-label="Dimension"
              value={dimension}
              onChange={setDimension}
              options={[
                { value: 'segment', label: 'Segment' },
                { value: 'industry', label: 'Industry' },
                { value: 'country', label: 'Country' },
              ]}
            />
          </PanelHeader>
          {dimensionRows.length === 0 ? (
            <EmptyState title={empty} className="self-center" />
          ) : (
            <BarRows
              label="ARR by dimension"
              format={fmtEur}
              rows={dimensionRows.map((r) => ({ label: r.label, value: r.arr, sub: plural(r.accounts, 'account', 'accounts') }))}
            />
          )}
          {unmatchedInDimension > 0 ? (
            <Note>{`${plural(unmatchedInDimension, 'account has', 'accounts have')} no Power BI match and add no ARR to the bars above.`}</Note>
          ) : (
            <span />
          )}
        </Panel>

        <Panel className={panel}>
          <PanelHeader title="Coverage" sub="Accounts by days since last contact" />
          {coverageBars.length === 0 ? (
            <EmptyState title={empty} className="self-center" />
          ) : (
            <BarRows label="Coverage" format={String} rows={coverageBars.map((b) => ({ label: b.label, value: b.count, sub: 'days since last contact' }))} />
          )}
          <span />
        </Panel>
      </div>
    </>
  );
}
