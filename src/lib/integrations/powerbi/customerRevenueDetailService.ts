import { executeDaxQuery } from './client';
import { arrMovementByBcnDax } from './queries';
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
    store.setMovement(key, {
      bcn,
      monthsBack,
      rows,
      fetchedAt: Date.now(),
    });
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
