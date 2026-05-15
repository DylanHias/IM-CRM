import { getDb } from '@/lib/db/client';
import { useRevenueStore, type CustomerRevenueRow } from '@/store/revenueStore';
import { executeDaxQuery } from './client';
import { CURRENT_ARR_BY_BCN_DAX } from './queries';

const WORKSPACE_ID = process.env.NEXT_PUBLIC_POWERBI_WORKSPACE_ID ?? '';
const DATASET_ID =
  process.env.NEXT_PUBLIC_POWERBI_DATASET_ID ?? '44da76a4-3c3f-44a8-abe9-48ff17247cc9';

const COLS_PER_ROW = 7;
const CHUNK = Math.floor(999 / COLS_PER_ROW);

interface RevenueRowDb {
  bcn: string;
  pbi_customer_id: string | null;
  arr_usd: number | null;
  arr_lc: number | null;
  currency_code: string | null;
  as_of_month: string | null;
  refreshed_at: string;
}

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
    pbiCustomerId: row.pbi_customer_id,
    arrUsd: row.arr_usd,
    arrLc: row.arr_lc,
    currencyCode: row.currency_code,
    asOfMonth: row.as_of_month,
    refreshedAt: row.refreshed_at,
  };
}

async function readSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    `SELECT value FROM app_settings WHERE key = $1`,
    [key],
  );
  return rows[0]?.value || null;
}

export async function getAutoRefreshHours(): Promise<number> {
  const v = await readSetting('revenue_auto_refresh_hours');
  const n = v ? Number(v) : 6;
  return Number.isFinite(n) && n > 0 ? n : 6;
}

export async function loadRevenueFromDb(): Promise<void> {
  const db = await getDb();
  const rows = await db.select<RevenueRowDb[]>(
    `SELECT bcn, pbi_customer_id, arr_usd, arr_lc, currency_code, as_of_month, refreshed_at
     FROM customer_revenue`,
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

export async function refreshRevenue(token: string): Promise<{ count: number }> {
  const store = useRevenueStore.getState();
  if (store.isRefreshing) return { count: store.byBcn.size };

  store.setRefreshing(true);
  try {
    const result = await executeDaxQuery(
      token,
      WORKSPACE_ID || null,
      DATASET_ID,
      CURRENT_ARR_BY_BCN_DAX,
    );
    const rows = result.rows ?? [];
    const refreshedAt = new Date().toISOString();

    const db = await getDb();
    await db.execute('BEGIN TRANSACTION');
    try {
      await db.execute('DELETE FROM customer_revenue');

      const byBcn = new Map<string, RevenueRowDb>();
      for (const row of rows) {
        const bcn = toStrOrNull(row['Customer[bcn]']);
        if (!bcn) continue;
        const next: RevenueRowDb = {
          bcn,
          pbi_customer_id: toStrOrNull(row['[customer_id]']),
          arr_usd: toNumOrNull(row['[ARR_USD]']),
          arr_lc: toNumOrNull(row['[ARR_LC]']),
          currency_code: toStrOrNull(row['[currency_code]']),
          as_of_month: toStrOrNull(row['[AsOfMonth]']),
          refreshed_at: refreshedAt,
        };
        const existing = byBcn.get(bcn);
        if (!existing || (next.arr_usd ?? 0) > (existing.arr_usd ?? 0)) {
          byBcn.set(bcn, next);
        }
      }
      const valid = Array.from(byBcn.values());

      for (let i = 0; i < valid.length; i += CHUNK) {
        const chunk = valid.slice(i, i + CHUNK);
        const placeholders = chunk
          .map(
            (_, j) =>
              `(${Array.from(
                { length: COLS_PER_ROW },
                (__, k) => `$${j * COLS_PER_ROW + k + 1}`,
              ).join(',')})`,
          )
          .join(',');
        const values = chunk.flatMap((r) => [
          r.bcn,
          r.pbi_customer_id,
          r.arr_usd,
          r.arr_lc,
          r.currency_code,
          r.as_of_month,
          r.refreshed_at,
        ]);
        await db.execute(
          `INSERT INTO customer_revenue
           (bcn, pbi_customer_id, arr_usd, arr_lc, currency_code, as_of_month, refreshed_at)
           VALUES ${placeholders}`,
          values,
        );
      }

      await db.execute(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES ('revenue_last_refresh_at', $1, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [refreshedAt],
      );
      await db.execute('COMMIT');

      useRevenueStore.getState().setRevenue(valid.map(mapDbRow), refreshedAt);
      return { count: valid.length };
    } catch (err) {
      await db.execute('ROLLBACK').catch(() => {
        // already rolled back or never started — surface the original error
      });
      throw err;
    }
  } finally {
    useRevenueStore.getState().setRefreshing(false);
  }
}

export async function maybeAutoRefresh(token: string): Promise<void> {
  const lastRefreshedAt = useRevenueStore.getState().lastRefreshedAt;
  const hours = await getAutoRefreshHours();
  if (!isStale(lastRefreshedAt, hours)) return;
  try {
    const { count } = await refreshRevenue(token);
    console.log(`[revenue] auto-refresh complete: ${count} customers`);
  } catch (err) {
    console.error('[revenue] auto-refresh failed:', err);
  }
}
