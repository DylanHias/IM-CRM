import { executeDaxQuery } from './client';
import { arrMovementByBcnDax } from './queries';
import { getDb } from '@/lib/db/client';
import {
  useCustomerRevenueDetailStore,
  movementKey,
  type ArrMovementRow,
} from '@/store/customerRevenueDetailStore';

const WORKSPACE_ID = process.env.NEXT_PUBLIC_POWERBI_WORKSPACE_ID ?? '';
const DATASET_ID =
  process.env.NEXT_PUBLIC_POWERBI_DATASET_ID ?? '44da76a4-3c3f-44a8-abe9-48ff17247cc9';

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function toNum(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toMonthIso(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  // Power BI DateTime values come back as ISO strings — normalize to YYYY-MM
  const m = s.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : s.slice(0, 7);
}

function parseRows(rows: Record<string, unknown>[]): ArrMovementRow[] {
  const out = rows.map((r) => ({
    month: toMonthIso(r["'ARR Movement'[month]"]),
    upgradeUsd: toNum(r['[Upgrade_USD]']),
    downgradeUsd: toNum(r['[Downgrade_USD]']),
    cancellationUsd: toNum(r['[Cancellation_USD]']),
    newSaleUsd: toNum(r['[NewSale_USD]']),
    upgradeLc: toNum(r['[Upgrade_LC]']),
    downgradeLc: toNum(r['[Downgrade_LC]']),
    cancellationLc: toNum(r['[Cancellation_LC]']),
    newSaleLc: toNum(r['[NewSale_LC]']),
  }));
  out.sort((a, b) => a.month.localeCompare(b.month));
  return out;
}

interface ArrMovementDbRow {
  bcn: string;
  months_back: number;
  month: string;
  upgrade_usd: number | null;
  downgrade_usd: number | null;
  cancellation_usd: number | null;
  new_sale_usd: number | null;
  upgrade_lc: number | null;
  downgrade_lc: number | null;
  cancellation_lc: number | null;
  new_sale_lc: number | null;
  refreshed_at: string;
}

function dbRowToRow(r: ArrMovementDbRow): ArrMovementRow {
  return {
    month: r.month,
    upgradeUsd: r.upgrade_usd ?? 0,
    downgradeUsd: r.downgrade_usd ?? 0,
    cancellationUsd: r.cancellation_usd ?? 0,
    newSaleUsd: r.new_sale_usd ?? 0,
    upgradeLc: r.upgrade_lc ?? 0,
    downgradeLc: r.downgrade_lc ?? 0,
    cancellationLc: r.cancellation_lc ?? 0,
    newSaleLc: r.new_sale_lc ?? 0,
  };
}

async function persistArrMovement(
  bcn: string,
  monthsBack: number,
  rows: ArrMovementRow[],
  refreshedAt: string,
): Promise<void> {
  const db = await getDb();
  try {
    await db.execute(
      `DELETE FROM arr_movement WHERE bcn = $1 AND months_back = $2`,
      [bcn, monthsBack],
    );
    for (const r of rows) {
      await db.execute(
        `INSERT OR REPLACE INTO arr_movement
          (bcn, months_back, month, upgrade_usd, downgrade_usd, cancellation_usd, new_sale_usd,
           upgrade_lc, downgrade_lc, cancellation_lc, new_sale_lc, refreshed_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          bcn,
          monthsBack,
          r.month,
          r.upgradeUsd,
          r.downgradeUsd,
          r.cancellationUsd,
          r.newSaleUsd,
          r.upgradeLc,
          r.downgradeLc,
          r.cancellationLc,
          r.newSaleLc,
          refreshedAt,
        ],
      );
    }
  } catch (err) {
    console.error('[revenue-detail] persist ARR movement failed:', err);
  }
}

export async function loadArrMovementFromDb(
  bcn: string,
  monthsBack: number,
): Promise<ArrMovementRow[] | null> {
  try {
    const db = await getDb();
    const rows = await db.select<ArrMovementDbRow[]>(
      `SELECT bcn, months_back, month, upgrade_usd, downgrade_usd, cancellation_usd, new_sale_usd,
              upgrade_lc, downgrade_lc, cancellation_lc, new_sale_lc, refreshed_at
       FROM arr_movement
       WHERE bcn = $1 AND months_back = $2
       ORDER BY month ASC`,
      [bcn, monthsBack],
    );
    if (rows.length === 0) return null;
    const mapped = rows.map(dbRowToRow);
    const key = movementKey(bcn, monthsBack);
    const store = useCustomerRevenueDetailStore.getState();
    const fetchedAt = new Date(rows[0].refreshed_at).getTime();
    store.setMovement(key, {
      bcn,
      monthsBack,
      rows: mapped,
      fetchedAt: Number.isFinite(fetchedAt) ? fetchedAt : Date.now(),
    });
    return mapped;
  } catch (err) {
    console.error('[revenue-detail] load ARR movement from DB failed:', err);
    return null;
  }
}

export async function fetchArrMovement(
  token: string,
  bcn: string,
  monthsBack: number,
  force = false,
): Promise<ArrMovementRow[]> {
  const key = movementKey(bcn, monthsBack);
  const store = useCustomerRevenueDetailStore.getState();

  const cached = store.movementByKey.get(key);
  if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rows;
  }

  if (store.loadingKeys.has(key)) {
    // Another fetch is already in flight — wait for it to land in the store
    return new Promise((resolve) => {
      const unsub = useCustomerRevenueDetailStore.subscribe((s) => {
        if (!s.loadingKeys.has(key)) {
          unsub();
          resolve(s.movementByKey.get(key)?.rows ?? []);
        }
      });
    });
  }

  store.setLoading(key, true);
  store.setError(key, null);
  try {
    const dax = arrMovementByBcnDax(bcn, monthsBack);
    const result = await executeDaxQuery(token, WORKSPACE_ID || null, DATASET_ID, dax);
    const rows = parseRows(result.rows ?? []);
    const refreshedAt = new Date().toISOString();
    store.setMovement(key, {
      bcn,
      monthsBack,
      rows,
      fetchedAt: Date.now(),
    });
    await persistArrMovement(bcn, monthsBack, rows, refreshedAt);
    return rows;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[revenue-detail] ARR movement fetch failed:', msg);
    store.setError(key, msg);
    throw err;
  } finally {
    store.setLoading(key, false);
  }
}
