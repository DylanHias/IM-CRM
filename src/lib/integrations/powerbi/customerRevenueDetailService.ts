import { executeDaxQuery } from './client';
import { ARR_MOVEMENT_SNAPSHOT_DAX } from './queries';
import { getDb } from '@/lib/db/client';
import {
  useCustomerRevenueDetailStore,
  type ArrMovementRow,
} from '@/store/customerRevenueDetailStore';

const WORKSPACE_ID = process.env.NEXT_PUBLIC_POWERBI_WORKSPACE_ID ?? '';
const DATASET_ID =
  process.env.NEXT_PUBLIC_POWERBI_DATASET_ID ?? '44da76a4-3c3f-44a8-abe9-48ff17247cc9';

function toNum(v: unknown): number {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toMonthIso(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  const m = s.match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : s.slice(0, 7);
}

function parseRows(rows: Record<string, unknown>[]): ArrMovementRow[] {
  return rows
    .map((r) => ({
      bcn: String(r['Reseller[bcn]'] ?? '').trim(),
      month: toMonthIso(r["'ARR Movement'[month]"]),
      upgradeLc: toNum(r['[Upgrade_LC]']),
      downgradeLc: toNum(r['[Downgrade_LC]']),
      cancellationLc: toNum(r['[Cancellation_LC]']),
      newSaleLc: toNum(r['[NewSale_LC]']),
    }))
    .filter((r) => r.bcn && r.month);
}

interface ArrMovementDbRow {
  bcn: string;
  month: string;
  upgrade_lc: number | null;
  downgrade_lc: number | null;
  cancellation_lc: number | null;
  new_sale_lc: number | null;
}

const ARR_MOVEMENT_COLS = 7;
const ARR_MOVEMENT_CHUNK = Math.floor(999 / ARR_MOVEMENT_COLS);

async function persistArrMovement(rows: ArrMovementRow[], refreshedAt: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM arr_movement`);
  // Chunked bulk insert — same pattern as customer_revenue. A per-row loop
  // holds the SQLite write lock long enough to break concurrent writers
  // (D365 sync, app_settings updates, the parallel insights snapshot).
  for (let i = 0; i < rows.length; i += ARR_MOVEMENT_CHUNK) {
    const chunk = rows.slice(i, i + ARR_MOVEMENT_CHUNK);
    const placeholders = chunk
      .map(
        (_, j) =>
          `(${Array.from(
            { length: ARR_MOVEMENT_COLS },
            (__, k) => `$${j * ARR_MOVEMENT_COLS + k + 1}`,
          ).join(',')})`,
      )
      .join(',');
    const values = chunk.flatMap((r) => [
      r.bcn,
      r.month,
      r.upgradeLc,
      r.downgradeLc,
      r.cancellationLc,
      r.newSaleLc,
      refreshedAt,
    ]);
    try {
      await db.execute(
        `INSERT OR REPLACE INTO arr_movement
          (bcn, month, upgrade_lc, downgrade_lc, cancellation_lc, new_sale_lc, refreshed_at)
         VALUES ${placeholders}`,
        values,
      );
    } catch (err) {
      console.error('[revenue] ARR movement chunk failed:', err instanceof Error ? err.message : err);
    }
  }
}

export async function loadArrMovementFromDb(): Promise<void> {
  try {
    const db = await getDb();
    const [rows, refreshedAtRow] = await Promise.all([
      db.select<ArrMovementDbRow[]>(
        `SELECT bcn, month, upgrade_lc, downgrade_lc, cancellation_lc, new_sale_lc
         FROM arr_movement
         ORDER BY bcn ASC, month ASC`,
      ),
      db.select<{ refreshed_at: string }[]>(`SELECT refreshed_at FROM arr_movement LIMIT 1`),
    ]);

    const mapped: ArrMovementRow[] = rows.map((r) => ({
      bcn: r.bcn,
      month: r.month,
      upgradeLc: r.upgrade_lc ?? 0,
      downgradeLc: r.downgrade_lc ?? 0,
      cancellationLc: r.cancellation_lc ?? 0,
      newSaleLc: r.new_sale_lc ?? 0,
    }));

    useCustomerRevenueDetailStore
      .getState()
      .setMovement(mapped, refreshedAtRow[0]?.refreshed_at ?? null);
    useCustomerRevenueDetailStore.getState().setHydrated(true);
  } catch (err) {
    console.error('[revenue-detail] hydrate failed:', err);
  }
}

export async function refreshArrMovementFromPowerBi(token: string): Promise<void> {
  const refreshedAt = new Date().toISOString();

  const result = await executeDaxQuery(
    token,
    WORKSPACE_ID || null,
    DATASET_ID,
    ARR_MOVEMENT_SNAPSHOT_DAX,
  );
  const rows = parseRows(result.rows ?? []);

  await persistArrMovement(rows, refreshedAt);
  useCustomerRevenueDetailStore.getState().setMovement(rows, refreshedAt);
  useCustomerRevenueDetailStore.getState().setHydrated(true);
}
