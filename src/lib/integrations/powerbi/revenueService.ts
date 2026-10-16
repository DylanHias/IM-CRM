import { getDb } from '@/lib/db/client';
import { useRevenueStore, type CustomerRevenueRow } from '@/store/revenueStore';
import { executeDaxQuery } from './client';
import { CURRENT_ARR_BY_BCN_DAX } from './queries';
import { buildMatchIndex, resolveCustomerId, type CustomerMatchIndex } from './matchCustomers';

const DATASET_ID =
  process.env.NEXT_PUBLIC_POWERBI_DATASET_ID ?? '44da76a4-3c3f-44a8-abe9-48ff17247cc9';

interface RevenueRowDb {
  bcn: string;
  customer_id: string | null;
  pbi_customer_id: string | null;
  reseller_account: string | null;
  arr_usd: number | null;
  arr_lc: number | null;
  currency_code: string | null;
  as_of_month: string | null;
  active_end_customers: number | null;
  refreshed_at: string;
}

// One source of truth for the cache's columns: the SELECT, the INSERT and the
// positional params are all generated from it, so a new column cannot land in
// the list without landing in the params at the same position.
export const REVENUE_COLUMNS: readonly (keyof RevenueRowDb)[] = [
  'bcn',
  'customer_id',
  'pbi_customer_id',
  'reseller_account',
  'arr_usd',
  'arr_lc',
  'currency_code',
  'as_of_month',
  'active_end_customers',
  'refreshed_at',
];
const COLS_PER_ROW = REVENUE_COLUMNS.length;
const CHUNK = Math.floor(999 / COLS_PER_ROW);

function toNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toStrOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function mapDbRow(row: RevenueRowDb): CustomerRevenueRow {
  return {
    bcn: row.bcn,
    customerId: row.customer_id,
    pbiCustomerId: row.pbi_customer_id,
    resellerAccount: row.reseller_account,
    arrUsd: row.arr_usd,
    arrLc: row.arr_lc,
    currencyCode: row.currency_code,
    asOfMonth: row.as_of_month,
    activeEndCustomers: row.active_end_customers,
    refreshedAt: row.refreshed_at,
  };
}

function toIntOrNull(v: unknown): number | null {
  const n = toNumOrNull(v);
  if (n === null) return null;
  return Math.round(n);
}

/**
 * Groups rows by BCN and packs whole groups into chunks, so every row belonging to
 * one BCN is written by a single statement. Splitting purely by row count would let
 * a BCN straddle a boundary, and then a failing chunk could delete the current rows
 * of a BCN whose remaining rows another chunk had already replaced, leaving it
 * reporting a partial sum.
 */
function chunkByBcn(rows: RevenueRowDb[], maxRows: number): RevenueRowDb[][] {
  const groups = new Map<string, RevenueRowDb[]>();
  for (const r of rows) {
    const group = groups.get(r.bcn);
    if (group) group.push(r);
    else groups.set(r.bcn, [r]);
  }

  const chunks: RevenueRowDb[][] = [];
  let current: RevenueRowDb[] = [];
  groups.forEach((group) => {
    // ponytail: a BCN with more rows than maxRows goes out oversized rather than
    // split, so all-or-nothing per BCN still holds. That needs ~100 reseller ids on
    // one BCN; if it ever happens the statement fails as one chunk, gets logged, and
    // the BCN keeps its previous rows. Raise maxRows (SQLite allows far more than
    // 999 parameters now) before considering a split.
    if (current.length > 0 && current.length + group.length > maxRows) {
      chunks.push(current);
      current = [];
    }
    current.push(...group);
  });
  if (current.length > 0) chunks.push(current);
  return chunks;
}

async function readSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    `SELECT value FROM app_settings WHERE key = $1`,
    [key],
  );
  return rows[0]?.value || null;
}

async function loadMatchIndex(): Promise<CustomerMatchIndex> {
  const db = await getDb();
  const rows = await db.select<{
    id: string;
    name: string;
    bcn: string | null;
    account_number: string | null;
    reseller_id: string | null;
    arm_id: string | null;
  }[]>(`SELECT id, name, bcn, account_number, reseller_id, arm_id FROM customers`);
  return buildMatchIndex(
    rows.map((r) => ({
      id: r.id,
      name: r.name ?? '',
      bcn: r.bcn,
      accountNumber: r.account_number,
      resellerId: r.reseller_id,
      armId: r.arm_id,
    })),
  );
}

export async function getAutoRefreshHours(): Promise<number> {
  const v = await readSetting('revenue_auto_refresh_hours');
  const n = v ? Number(v) : 6;
  return Number.isFinite(n) && n > 0 ? n : 6;
}

export async function loadRevenueFromDb(): Promise<void> {
  const db = await getDb();
  const rows = await db.select<RevenueRowDb[]>(
    `SELECT ${REVENUE_COLUMNS.join(', ')} FROM customer_revenue`,
  );
  const lastRefreshed = await readSetting('revenue_last_refresh_at');
  useRevenueStore.getState().setRevenue(rows.map(mapDbRow), lastRefreshed || null);
  useRevenueStore.getState().setHydrated(true);
}

function isStale(lastRefreshedAt: string | null, hours: number): boolean {
  if (!lastRefreshedAt) return true;
  const t = new Date(lastRefreshedAt).getTime();
  if (!Number.isFinite(t)) return true;
  return Date.now() - t > hours * 3600 * 1000;
}

export interface RefreshRevenueOpts {
  /** Wait for the snapshot datasets (insights + ARR movement) to finish before resolving. */
  awaitSnapshots?: boolean;
}

export async function refreshRevenue(
  token: string,
  opts?: RefreshRevenueOpts,
): Promise<{ count: number }> {
  const store = useRevenueStore.getState();
  if (store.isRefreshing) return { count: store.byBcn.size };

  store.setRefreshing(true);
  try {
    const result = await executeDaxQuery(
      token,
      null,
      DATASET_ID,
      CURRENT_ARR_BY_BCN_DAX,
    );
    const rows = result.rows ?? [];
    const refreshedAt = new Date().toISOString();

    const db = await getDb();
    const index = await loadMatchIndex();

    // Every Power BI row that resolves to a CRM customer is kept and summed on read;
    // rows that resolve to nobody are counted as unmatched, never stored as zero.
    const valid: RevenueRowDb[] = [];
    let skippedNotInCrm = 0;
    for (const row of rows) {
      const bcn = toStrOrNull(row['Reseller[bcn]']);
      if (!bcn) continue;
      const resellerAccount = toStrOrNull(row['Reseller[Reseller Account]']);
      const resellerId = toStrOrNull(row['Reseller[reseller_id]']);
      const customerId = resolveCustomerId(
        {
          bcn,
          resellerAccount,
          resellerId,
          marketplaceId: toStrOrNull(row['Reseller[marketplace_id]']),
          resellerName: toStrOrNull(row['Reseller[Reseller Name]']),
        },
        index,
      );
      if (!customerId) {
        skippedNotInCrm++;
        continue;
      }
      valid.push({
        bcn,
        customer_id: customerId,
        pbi_customer_id: resellerId,
        reseller_account: resellerAccount,
        arr_usd: toNumOrNull(row['[ARR_USD]']),
        arr_lc: toNumOrNull(row['[ARR_LC]']),
        currency_code: toStrOrNull(row['Reseller[currency_code]']),
        as_of_month: toStrOrNull(row['[AsOfMonth]']),
        active_end_customers: toIntOrNull(row['[ActiveEndCustomers]']),
        refreshed_at: refreshedAt,
      });
    }

    // Same pattern as bulkUpsertCustomers / bulkUpsertOpportunities: each chunk
    // auto-commits so the write lock is released between batches and concurrent
    // sync/auth writes can interleave. Per-chunk try/catch keeps one bad batch
    // from aborting the whole refresh.
    let inserted = 0;
    let errors = 0;
    for (const chunk of chunkByBcn(valid, CHUNK)) {
      const placeholders = chunk
        .map(
          (_, j) =>
            `(${Array.from(
              { length: COLS_PER_ROW },
              (__, k) => `$${j * COLS_PER_ROW + k + 1}`,
            ).join(',')})`,
        )
        .join(',');
      const values = chunk.flatMap((r) => REVENUE_COLUMNS.map((c) => r[c]));
      // A BCN now holds one row per Power BI reseller id, so there is no primary key
      // left for INSERT OR REPLACE to collapse onto. Clear this chunk's BCNs, then
      // insert their replacements. Deleting first is what keeps a half-written chunk
      // honest: the BCNs end up with no rows and fall back to the D365 ARR, instead
      // of holding the old and the new rows at once and reporting double. Chunks are
      // packed on BCN boundaries, so clearing a BCN here can never strand rows that
      // another chunk was responsible for. `refreshed_at < $1` is belt-and-braces.
      const bcns = Array.from(new Set(chunk.map((r) => r.bcn)));
      try {
        await db.execute(
          `DELETE FROM customer_revenue
           WHERE refreshed_at < $1 AND bcn IN (${bcns.map((_, j) => `$${j + 2}`).join(',')})`,
          [refreshedAt, ...bcns],
        );
        const result = await db.execute(
          `INSERT INTO customer_revenue (${REVENUE_COLUMNS.join(', ')})
           VALUES ${placeholders}`,
          values,
        );
        inserted += result.rowsAffected;
      } catch (err) {
        console.error('[revenue] Bulk write chunk failed:', err instanceof Error ? err.message : err);
        errors++;
      }
    }

    // Each chunk already cleared its own BCNs, so this only removes BCNs that
    // dropped out of Power BI altogether. Still gated on a clean run: after a
    // partial failure the picture is incomplete, so leave those rows alone.
    if (errors === 0) {
      try {
        await db.execute(
          `DELETE FROM customer_revenue WHERE refreshed_at < $1`,
          [refreshedAt],
        );
      } catch (err) {
        console.error('[revenue] Stale-row prune failed:', err instanceof Error ? err.message : err);
      }
    }

    try {
      await db.execute(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES ('revenue_last_refresh_at', $1, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [refreshedAt],
      );
    } catch (err) {
      console.error('[revenue] last-refresh timestamp write failed:', err instanceof Error ? err.message : err);
    }

    // Callers label this "customers updated", and a customer can own several rows.
    const matchedCustomers = new Set(valid.map((r) => r.customer_id)).size;

    console.log(
      `[revenue] refresh complete: ${inserted} rows inserted across ${matchedCustomers} customers, ${skippedNotInCrm} Power BI rows skipped (not in CRM), ${errors} chunk${errors === 1 ? '' : 's'} failed`,
    );

    useRevenueStore.getState().setRevenue(valid.map(mapDbRow), refreshedAt);

    // Snapshot datasets (insights + ARR movement) are detached from the foreground
    // refresh — they pull large Benelux-wide DAX snapshots and would otherwise block
    // the user-facing refresh result. UI reads from local DB, so a brief lag before
    // the next refresh just means charts show the previous snapshot.
    if (opts?.awaitSnapshots) {
      await refreshSnapshotsInBackground(token);
    } else {
      void refreshSnapshotsInBackground(token);
    }

    return { count: matchedCustomers };
  } finally {
    useRevenueStore.getState().setRefreshing(false);
  }
}

async function refreshSnapshotsInBackground(token: string): Promise<void> {
  await Promise.all([
    (async () => {
      try {
        const { refreshInsightsFromPowerBi } = await import('./revenueInsightsService');
        await refreshInsightsFromPowerBi(token);
      } catch (err) {
        console.error('[revenue] insights snapshot refresh failed:', err instanceof Error ? err.message : err);
      }
    })(),
    (async () => {
      try {
        const { refreshArrMovementFromPowerBi } = await import('./customerRevenueDetailService');
        await refreshArrMovementFromPowerBi(token);
      } catch (err) {
        console.error('[revenue] ARR movement snapshot refresh failed:', err instanceof Error ? err.message : err);
      }
    })(),
  ]);
}

async function snapshotsNeedBackfill(): Promise<boolean> {
  // After the v46 schema migration the four snapshot tables are dropped and
  // recreated empty, but revenue_last_refresh_at stays fresh — so the staleness
  // check below would skip the refresh and the ARR movement / insights charts
  // would render blank forever. Force a refresh whenever any snapshot is empty.
  // Also force a refresh when arr_movement has rows but no valid bcns — that's
  // the broken-state v2.12.91 left when joining on 'ARR Movement'[bcn] returned
  // blanks. The corrected query (v2.12.92+) joins on Reseller[bcn] instead.
  try {
    const db = await getDb();
    const tables = ['arr_movement', 'arr_trend', 'reseller_seats_trend', 'net_sales_by_vendor'];
    for (const t of tables) {
      const rows = await db.select<{ c: number }[]>(`SELECT COUNT(*) AS c FROM ${t}`);
      if ((rows[0]?.c ?? 0) === 0) return true;
    }
    const validBcns = await db.select<{ c: number }[]>(
      `SELECT COUNT(*) AS c FROM arr_movement WHERE bcn IS NOT NULL AND bcn <> ''`,
    );
    if ((validBcns[0]?.c ?? 0) === 0) return true;
    return false;
  } catch (err) {
    console.error('[revenue] snapshot backfill check failed:', err instanceof Error ? err.message : err);
    return false;
  }
}

export async function maybeAutoRefresh(token: string): Promise<void> {
  const lastRefreshedAt = useRevenueStore.getState().lastRefreshedAt;
  const hours = await getAutoRefreshHours();
  const stale = isStale(lastRefreshedAt, hours);
  const backfill = !stale && (await snapshotsNeedBackfill());
  if (!stale && !backfill) return;
  try {
    const { count } = await refreshRevenue(token);
    console.log(
      `[revenue] auto-refresh complete: ${count} customers${backfill ? ' (snapshot backfill)' : ''}`,
    );
  } catch (err) {
    console.error('[revenue] auto-refresh failed:', err);
  }
}
