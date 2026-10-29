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
import { useReportScope } from '@/hooks/useReportScope';
import {
  queryAccountSummary,
  queryAccountsRanked,
  queryArrByDimension,
  queryTopConcentration,
} from '@/lib/db/queries/reports/accounts';
import { topDimensionsWithOther } from '@/lib/reports/pipelineShape';
import { formatEurCompact } from '@/lib/utils/currencyUtils';
import type { Region } from '@/lib/revenue/region';
import type { AccountSummary, DimensionRow, RankedAccount } from '@/types/reports';

type Dimension = 'segment' | 'industry' | 'country';

interface Data {
  key: string;
  summary: AccountSummary;
  concentration: number | null;
  ranked: RankedAccount[];
  byDimension: Record<Dimension, DimensionRow[]>;
}

interface Props {
  filters: ReportFilters;
}

const RANKED_LIMIT = 200;
const RANKED_ROW_HEIGHT = 44;
const DIMENSION_ROWS = 8;
const TOP_N = 10;
const SNAPSHOT = 'point in time';
const ACCOUNTS: Record<Region, string> = {
  BENELUX: 'all Benelux accounts',
  BE: 'Belgian accounts',
  NL: 'Dutch accounts',
  LU: 'Luxembourg accounts',
};

const fmtEur = formatEurCompact;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const contactLabel = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : 'never contacted';

function useAccountsData(filters: ReportFilters) {
  const { scope, key } = useReportScope(filters);
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!scope) return;
    let stale = false;
    const load = async () => {
      setFailed(false);
      try {
        // All three dimensions up front: the switch is a view of data already in hand, not a reload.
        const [summary, concentration, ranked, segment, industry, country] = await Promise.all([
          queryAccountSummary(scope),
          queryTopConcentration(scope, TOP_N),
          queryAccountsRanked(scope, RANKED_LIMIT, 0),
          queryArrByDimension(scope, 'segment'),
          queryArrByDimension(scope, 'industry'),
          queryArrByDimension(scope, 'country'),
        ]);
        if (!stale) setData({ key, summary, concentration, ranked, byDimension: { segment, industry, country } });
      } catch (err) {
        console.error('[customer] Accounts tab failed to load:', err);
        if (!stale) setFailed(true);
      }
    };
    load();
    return () => {
      stale = true;
    };
    // key stands in for the scope; none of these queries takes a period.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data: data?.key === key ? data : null, failed };
}

function Note({ children }: { children: string }) {
  return <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">{children}</p>;
}

export function AccountsTab({ filters }: Props) {
  const [dimension, setDimension] = useState<Dimension>('segment');
  const { data, failed } = useAccountsData(filters);
  const ranked = usePagedRows(data?.ranked ?? [], RANKED_ROW_HEIGHT);
  const dimensionRows = useMemo(() => topDimensionsWithOther(data?.byDimension[dimension] ?? [], DIMENSION_ROWS), [data?.byDimension, dimension]);

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

  const { summary, concentration } = data;
  const accounts = filters.scope === 'mine' ? 'your accounts' : ACCOUNTS[filters.region];
  const caption = `${accounts} · ${SNAPSHOT}`;
  const empty = 'No accounts in this scope';
  const anyAccounts = summary.total > 0;
  const unmatchedInDimension = dimensionRows.reduce((t, r) => t + (r.accounts - r.matched), 0);
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
          <ReportTile label="Top-10 concentration" value={`${Math.round(concentration)}%`} caption={`share held by the 10 largest · ${SNAPSHOT}`} />
        )}
        {anyAccounts ? (
          <ReportTile label="No open opportunity" value={`${summary.noOpenOpp}`} caption={`${caption} · open deals are the synced team’s only`} />
        ) : (
          <ReportTile label="No open opportunity" empty="No accounts in scope" caption={caption} />
        )}
        {anyAccounts ? (
          <ReportTile label="Not contacted in 90 days" value={`${summary.notContacted90d}`} caption={`${caption} · ${summary.neverContacted} never contacted`} />
        ) : (
          <ReportTile label="Not contacted in 90 days" empty="No accounts in scope" caption={caption} />
        )}
      </MetricStrip>

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel className={panel}>
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
          <div>
            {data.ranked.length < summary.total && (
              <Note>{`Showing the top ${data.ranked.length} of ${summary.total} accounts by revenue.`}</Note>
            )}
            <CompactPager page={ranked.page} pageSize={ranked.pageSize} total={data.ranked.length} onPageChange={ranked.setPage} />
          </div>
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
              label={`ARR by ${dimension}`}
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

      </div>
    </>
  );
}
