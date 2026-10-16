import { getDb } from '@/lib/db/client';
import { accountScopeSql, type ReportScope } from '@/lib/reports/scope';
import { ARR_BY_CUSTOMER, daysSinceSql, lastContactSql, paramBinder } from '@/lib/reports/sql';
import type { AccountSummary, CoverageBucket, DimensionRow, RankedAccount } from '@/types/reports';

const COVERAGE_BUCKETS: CoverageBucket[] = ['0-30', '31-60', '61-90', '90+', 'never'];

export async function queryAccountSummary(s: ReportScope): Promise<AccountSummary> {
  const scope = accountScopeSql(s, 0);
  const { params, bind } = paramBinder(scope.params);
  const nowIso = new Date().toISOString();
  try {
    const db = await getDb();
    const sql = `SELECT COUNT(*) AS total,
              COUNT(CASE WHEN r.arr > 0 THEN 1 END) AS withArr,
              COUNT(CASE WHEN NOT EXISTS (SELECT 1 FROM opportunities o WHERE o.customer_id = c.id AND o.status = 'Open') THEN 1 END) AS noOpenOpp,
              COUNT(CASE WHEN lc.last_at IS NOT NULL AND ${daysSinceSql(bind(nowIso))} > 90 THEN 1 END) AS notContacted90d,
              COUNT(CASE WHEN lc.last_at IS NULL THEN 1 END) AS neverContacted
       FROM customers c
       LEFT JOIN ${ARR_BY_CUSTOMER} r ON r.customer_id = c.id
       LEFT JOIN ${lastContactSql(bind(nowIso))} lc ON lc.customer_id = c.id
       WHERE ${scope.sql}`;
    const [r] = await db.select<AccountSummary[]>(sql, params);
    return r ?? { total: 0, withArr: 0, noOpenOpp: 0, notContacted90d: 0, neverContacted: 0 };
  } catch (err) {
    console.error('[customer] queryAccountSummary failed:', err);
    throw err;
  }
}

/** Percent of scope ARR held by the n largest accounts; null when scope holds no ARR. */
export async function queryTopConcentration(s: ReportScope, n: number): Promise<number | null> {
  const scope = accountScopeSql(s, 0);
  try {
    const db = await getDb();
    const [r] = await db.select<{ top: number | null; total: number | null }[]>(
      `WITH a AS (
         SELECT r.arr AS arr FROM customers c
         JOIN ${ARR_BY_CUSTOMER} r ON r.customer_id = c.id
         WHERE ${scope.sql} AND r.arr > 0
       )
       SELECT (SELECT SUM(arr) FROM (SELECT arr FROM a ORDER BY arr DESC LIMIT $${scope.params.length + 1})) AS top,
              (SELECT SUM(arr) FROM a) AS total`,
      [...scope.params, n],
    );
    return r?.total ? ((r.top ?? 0) / r.total) * 100 : null;
  } catch (err) {
    console.error('[customer] queryTopConcentration failed:', err);
    throw err;
  }
}

export async function queryAccountsRanked(s: ReportScope, limit: number, offset: number): Promise<RankedAccount[]> {
  const scope = accountScopeSql(s, 0);
  const { params, bind } = paramBinder(scope.params);
  try {
    const db = await getDb();
    const sql = `SELECT c.id, c.name, r.arr AS arr, lc.last_at AS lastContactAt,
              (SELECT COUNT(*) FROM opportunities o WHERE o.customer_id = c.id AND o.status = 'Open') AS openDeals
       FROM customers c
       LEFT JOIN ${ARR_BY_CUSTOMER} r ON r.customer_id = c.id
       LEFT JOIN ${lastContactSql(bind(new Date().toISOString()))} lc ON lc.customer_id = c.id
       WHERE ${scope.sql}
       ORDER BY r.arr IS NULL, r.arr DESC, c.name ASC
       LIMIT ${bind(limit)} OFFSET ${bind(offset)}`;
    return await db.select<RankedAccount[]>(sql, params);
  } catch (err) {
    console.error('[customer] queryAccountsRanked failed:', err);
    throw err;
  }
}

const DIMENSION_COLUMN = { segment: 'c.segment', industry: 'c.industry', country: 'c.address_country' } as const;

/** Every group, largest first; `matched` is how many accounts have a Power BI row, since unmatched ones add no ARR. Truncation and any "Other" roll-up belong to the caller. */
export async function queryArrByDimension(s: ReportScope, dim: keyof typeof DIMENSION_COLUMN): Promise<DimensionRow[]> {
  const scope = accountScopeSql(s, 0);
  try {
    const db = await getDb();
    return await db.select<DimensionRow[]>(
      `SELECT COALESCE(NULLIF(TRIM(${DIMENSION_COLUMN[dim]}), ''), 'Not set') AS label,
              COALESCE(SUM(r.arr), 0) AS arr, COUNT(*) AS accounts, COUNT(r.customer_id) AS matched
       FROM customers c
       LEFT JOIN ${ARR_BY_CUSTOMER} r ON r.customer_id = c.id
       WHERE ${scope.sql}
       GROUP BY label
       ORDER BY arr DESC, label ASC`,
      scope.params,
    );
  } catch (err) {
    console.error('[customer] queryArrByDimension failed:', err);
    throw err;
  }
}

export async function queryCoverageBuckets(s: ReportScope): Promise<{ bucket: CoverageBucket; count: number }[]> {
  const scope = accountScopeSql(s, 0);
  const { params, bind } = paramBinder(scope.params);
  const nowIso = new Date().toISOString();
  try {
    const db = await getDb();
    const sql = `SELECT CASE WHEN lc.last_at IS NULL THEN 'never'
                   WHEN ${daysSinceSql(bind(nowIso))} <= 30 THEN '0-30'
                   WHEN ${daysSinceSql(bind(nowIso))} <= 60 THEN '31-60'
                   WHEN ${daysSinceSql(bind(nowIso))} <= 90 THEN '61-90'
                   ELSE '90+' END AS bucket,
              COUNT(*) AS count
       FROM customers c
       LEFT JOIN ${lastContactSql(bind(nowIso))} lc ON lc.customer_id = c.id
       WHERE ${scope.sql}
       GROUP BY bucket`;
    const rows = await db.select<{ bucket: CoverageBucket; count: number }[]>(sql, params);
    return COVERAGE_BUCKETS.map((bucket) => ({ bucket, count: rows.find((r) => r.bucket === bucket)?.count ?? 0 }));
  } catch (err) {
    console.error('[customer] queryCoverageBuckets failed:', err);
    throw err;
  }
}
