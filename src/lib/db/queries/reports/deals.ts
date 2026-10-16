import { format } from 'date-fns';
import { getDb } from '@/lib/db/client';
import { OPP_ARR } from '@/lib/db/queries/analytics';
import { monthKeys, type ReportPeriod } from '@/lib/reports/period';
import { dealScopeSql, type ReportScope } from '@/lib/reports/scope';

// Money is summed in EUR only: no FX rate exists, so other currencies are counted, not converted.
const EUR = "currency = 'EUR'";
// The close dialog defaults actual_revenue to 0, so zero means "not entered", not "worth nothing".
const WON_VALUE = `CASE WHEN actual_revenue IS NOT NULL AND actual_revenue != 0 THEN actual_revenue ELSE ${OPP_ARR} END`;

const eurSum = (value: string) => `COALESCE(SUM(CASE WHEN ${EUR} THEN ${value} ELSE 0 END), 0)`;
const eurCount = `COUNT(CASE WHEN ${EUR} THEN 1 END)`;
const nonEurCount = `COUNT(CASE WHEN ${EUR} THEN NULL ELSE 1 END)`;

export interface Money {
  value: number;
  count: number;
  excludedNonEur: number;
}

export interface MonthTotal {
  month: string;
  count: number;
  value: number;
}

export interface ClosedMonth {
  month: string;
  won: { count: number; value: number };
  lost: { count: number; value: number };
}

export interface BreakdownRow extends Money {
  label: string;
}

export interface Forecast {
  buckets: { month: string; value: number }[];
  noCloseDateCount: number;
  noCloseDateValue: number;
  excludedNonEur: number;
}

export interface QuietDeal {
  id: string;
  subject: string;
  customerId: string;
  customerName: string;
  stage: string;
  value: number;
  currency: string;
  lastActivityAt: string;
  daysStale: number;
}

export async function queryOpenPipeline(s: ReportScope): Promise<Money & { weighted: number }> {
  const scope = dealScopeSql(s, 0);
  try {
    const db = await getDb();
    const [r] = await db.select<{ value: number; count: number; weighted: number; excluded: number }[]>(
      `SELECT ${eurSum(OPP_ARR)} AS value, ${eurCount} AS count,
              ${eurSum(`${OPP_ARR} * probability / 100.0`)} AS weighted, ${nonEurCount} AS excluded
       FROM opportunities o
       WHERE o.status = 'Open' AND ${scope.sql}`,
      scope.params,
    );
    return { value: r?.value ?? 0, count: r?.count ?? 0, weighted: r?.weighted ?? 0, excludedNonEur: r?.excluded ?? 0 };
  } catch (err) {
    console.error('[opportunity] queryOpenPipeline failed:', err);
    throw err;
  }
}

export async function queryNewOpportunities(
  s: ReportScope,
  p: ReportPeriod,
): Promise<{ total: Money; byMonth: MonthTotal[] }> {
  const months = monthKeys(p);
  if (months.length === 0) return { total: { value: 0, count: 0, excludedNonEur: 0 }, byMonth: [] };
  const scope = dealScopeSql(s, 0);
  const n = scope.params.length;
  try {
    const db = await getDb();
    const rows = await db.select<{ month: string; value: number; count: number; excluded: number }[]>(
      `SELECT strftime('%Y-%m', created_at) AS month, ${eurSum(OPP_ARR)} AS value,
              ${eurCount} AS count, ${nonEurCount} AS excluded
       FROM opportunities o
       WHERE ${scope.sql}
         AND strftime('%Y-%m', created_at) >= $${n + 1} AND strftime('%Y-%m', created_at) <= $${n + 2}
       GROUP BY month`,
      [...scope.params, months[0], months[months.length - 1]],
    );
    const byKey = new Map(rows.map((r) => [r.month, r]));
    const byMonth = months.map((month) => ({
      month,
      count: byKey.get(month)?.count ?? 0,
      value: byKey.get(month)?.value ?? 0,
    }));
    return {
      total: {
        count: byMonth.reduce((t, m) => t + m.count, 0),
        value: byMonth.reduce((t, m) => t + m.value, 0),
        excludedNonEur: rows.reduce((t, r) => t + r.excluded, 0),
      },
      byMonth,
    };
  } catch (err) {
    console.error('[opportunity] queryNewOpportunities failed:', err);
    throw err;
  }
}

export async function queryClosedDeals(
  s: ReportScope,
  p: ReportPeriod,
): Promise<{ won: Money; lost: Money; winRatePct: number | null; byMonth: ClosedMonth[] }> {
  const months = monthKeys(p);
  const empty = (): Money => ({ value: 0, count: 0, excludedNonEur: 0 });
  if (months.length === 0) return { won: empty(), lost: empty(), winRatePct: null, byMonth: [] };
  const scope = dealScopeSql(s, 0);
  const n = scope.params.length;
  try {
    const db = await getDb();
    const rows = await db.select<{ month: string; status: 'Won' | 'Lost'; value: number; count: number; excluded: number }[]>(
      `SELECT strftime('%Y-%m', close_date) AS month, status,
              ${eurSum(`CASE WHEN status = 'Won' THEN ${WON_VALUE} ELSE ${OPP_ARR} END`)} AS value,
              ${eurCount} AS count, ${nonEurCount} AS excluded
       FROM opportunities o
       WHERE status IN ('Won', 'Lost') AND ${scope.sql}
         AND strftime('%Y-%m', close_date) >= $${n + 1} AND strftime('%Y-%m', close_date) <= $${n + 2}
       GROUP BY month, status`,
      [...scope.params, months[0], months[months.length - 1]],
    );
    const won = empty();
    const lost = empty();
    const byMonth: ClosedMonth[] = months.map((month) => ({
      month,
      won: { count: 0, value: 0 },
      lost: { count: 0, value: 0 },
    }));
    for (const r of rows) {
      const side = r.status === 'Won' ? won : lost;
      side.value += r.value;
      side.count += r.count;
      side.excludedNonEur += r.excluded;
      const bucket = byMonth.find((m) => m.month === r.month);
      if (bucket) {
        const cell = r.status === 'Won' ? bucket.won : bucket.lost;
        cell.count = r.count;
        cell.value = r.value;
      }
    }
    const closedValue = won.value + lost.value;
    return { won, lost, winRatePct: closedValue > 0 ? (won.value / closedValue) * 100 : null, byMonth };
  } catch (err) {
    console.error('[opportunity] queryClosedDeals failed:', err);
    throw err;
  }
}

/** Mean value over deals that carry one; blanks and zeros are not deals of size zero. */
export async function queryAvgDealSize(s: ReportScope): Promise<number | null> {
  const scope = dealScopeSql(s, 0);
  try {
    const db = await getDb();
    const [r] = await db.select<{ avg: number | null }[]>(
      `SELECT AVG(NULLIF(${OPP_ARR}, 0)) AS avg FROM opportunities o WHERE ${EUR} AND ${scope.sql}`,
      scope.params,
    );
    return r?.avg ?? null;
  } catch (err) {
    console.error('[opportunity] queryAvgDealSize failed:', err);
    throw err;
  }
}

async function openPipelineBy(s: ReportScope, labelSql: string): Promise<BreakdownRow[]> {
  const scope = dealScopeSql(s, 0);
  try {
    const db = await getDb();
    const rows = await db.select<{ label: string; value: number; count: number; excluded: number }[]>(
      `SELECT ${labelSql} AS label, ${eurSum(OPP_ARR)} AS value, ${eurCount} AS count, ${nonEurCount} AS excluded
       FROM opportunities o
       WHERE o.status = 'Open' AND ${scope.sql}
       GROUP BY label
       ORDER BY value DESC, label ASC`,
      scope.params,
    );
    return rows.map((r) => ({ label: r.label, value: r.value, count: r.count, excludedNonEur: r.excluded }));
  } catch (err) {
    console.error('[opportunity] pipeline breakdown failed:', err);
    throw err;
  }
}

// A null or blank dimension gets its own row so the bars still add up to the pipeline total.
const orNotSet = (column: string) => `COALESCE(NULLIF(TRIM(${column}), ''), 'Not set')`;

export function queryPipelineByStage(s: ReportScope): Promise<BreakdownRow[]> {
  return openPipelineBy(s, orNotSet('stage'));
}

export function queryPipelineByDimension(s: ReportScope, dim: 'vendor' | 'sellType'): Promise<BreakdownRow[]> {
  return openPipelineBy(s, orNotSet(dim === 'vendor' ? 'primary_vendor' : 'sell_type'));
}

/** Open pipeline by expected close month. Past dates collapse into 'overdue'; undated deals are counted apart. */
export async function queryForecastByMonth(s: ReportScope): Promise<Forecast> {
  const scope = dealScopeSql(s, 0);
  const n = scope.params.length;
  const bucket = `CASE WHEN expiration_date IS NULL OR TRIM(expiration_date) = '' THEN NULL
                       WHEN substr(expiration_date, 1, 10) < $${n + 1} THEN 'overdue'
                       ELSE strftime('%Y-%m', expiration_date) END`;
  try {
    const db = await getDb();
    const rows = await db.select<{ bucket: string | null; value: number; count: number; excluded: number }[]>(
      `SELECT ${bucket} AS bucket, ${eurSum(OPP_ARR)} AS value, ${eurCount} AS count, ${nonEurCount} AS excluded
       FROM opportunities o
       WHERE o.status = 'Open' AND ${scope.sql}
       GROUP BY bucket
       ORDER BY bucket = 'overdue' DESC, bucket ASC`,
      [...scope.params, format(new Date(), 'yyyy-MM-dd')],
    );
    const undated = rows.find((r) => r.bucket === null);
    const buckets = rows.flatMap((r) => (r.bucket !== null && r.count > 0 ? [{ month: r.bucket, value: r.value }] : []));
    return {
      buckets,
      noCloseDateCount: undated?.count ?? 0,
      noCloseDateValue: undated?.value ?? 0,
      excludedNonEur: rows.reduce((t, r) => t + r.excluded, 0),
    };
  } catch (err) {
    console.error('[opportunity] queryForecastByMonth failed:', err);
    throw err;
  }
}

/** Scoped sibling of queryMyStaleOpportunities (which Home still calls): open deals with no recent activity. */
export async function queryQuietDeals(s: ReportScope, idleDays: number, limit: number): Promise<QuietDeal[]> {
  const scope = dealScopeSql(s, 0);
  const n = scope.params.length;
  const cutoff = new Date(Date.now() - idleDays * 86400000).toISOString();
  try {
    const db = await getDb();
    const rows = await db.select<Omit<QuietDeal, 'daysStale'>[]>(
      `SELECT * FROM (
         SELECT o.id, o.subject, o.customer_id AS customerId,
           COALESCE((SELECT name FROM customers WHERE id = o.customer_id), 'Unknown') AS customerName,
           o.stage, ${OPP_ARR} AS value, o.currency,
           COALESCE((SELECT MAX(a.occurred_at) FROM activities a WHERE a.customer_id = o.customer_id), o.updated_at) AS lastActivityAt
         FROM opportunities o
         WHERE o.status = 'Open' AND ${scope.sql}
       )
       WHERE lastActivityAt < $${n + 1}
       ORDER BY lastActivityAt ASC
       LIMIT $${n + 2}`,
      [...scope.params, cutoff, limit],
    );
    const now = Date.now();
    return rows.map((r) => ({ ...r, daysStale: Math.floor((now - new Date(r.lastActivityAt).getTime()) / 86400000) }));
  } catch (err) {
    console.error('[opportunity] queryQuietDeals failed:', err);
    throw err;
  }
}
