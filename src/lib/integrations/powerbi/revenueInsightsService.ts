import { executeDaxQuery } from './client';
import {
  ARR_TREND_SNAPSHOT_DAX,
  NET_SALES_SNAPSHOT_DAX,
  RESELLER_SEATS_SNAPSHOT_DAX,
} from './queries';
import { getDb } from '@/lib/db/client';
import {
  useRevenueInsightsStore,
  type ArrTrendRow,
  type ResellerSeatsRow,
  type VendorSalesRow,
} from '@/store/revenueInsightsStore';

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

function toCountry(v: unknown): string {
  return String(v ?? '').trim().toUpperCase();
}

interface ArrTrendDbRow {
  month: string;
  country_code: string;
  arr_lc: number | null;
  customer_count: number | null;
}

interface ResellerSeatsDbRow {
  month: string;
  country_code: string;
  active_resellers: number | null;
  active_seats: number | null;
}

interface VendorSalesDbRow {
  month: string;
  country_code: string;
  vendor: string;
  net_sales_lc: number | null;
}

function parseArrTrend(rows: Record<string, unknown>[]): ArrTrendRow[] {
  return rows
    .map((r) => ({
      month: toMonthIso(r['ARR[calendar_month]']),
      countryCode: toCountry(r['Reseller[country_code]']),
      arrLc: toNum(r['[ARR_LC]']),
      customerCount: toNum(r['[CustomerCount]']),
    }))
    .filter((r) => r.month && r.countryCode);
}

function parseResellerSeats(rows: Record<string, unknown>[]): ResellerSeatsRow[] {
  return rows
    .map((r) => ({
      month: toMonthIso(r['Seats[month]']),
      countryCode: toCountry(r['Reseller[country_code]']),
      activeResellers: toNum(r['[ActiveResellers]']),
      activeSeats: toNum(r['[ActiveSeats]']),
    }))
    .filter((r) => r.month && r.countryCode);
}

function parseVendorSales(rows: Record<string, unknown>[]): VendorSalesRow[] {
  return rows
    .map((r) => ({
      month: toMonthIso(r['Sales[month]']),
      countryCode: toCountry(r['Reseller[country_code]']),
      vendor: String(r['Vendor[vendor_name]'] ?? '').trim(),
      netSalesLc: toNum(r['[NetSales_LC]']),
    }))
    .filter((r) => r.month && r.countryCode && r.vendor);
}

// Chunked bulk insert helper — same pattern as customer_revenue.
// Per-row loops hold the SQLite write lock long enough to break concurrent writers.
async function bulkInsert<T>(
  table: string,
  columns: string[],
  rows: T[],
  toValues: (r: T) => unknown[],
  refreshedAt: string,
): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM ${table}`);
  const colCount = columns.length + 1; // +1 for refreshed_at
  const chunkSize = Math.floor(999 / colCount);
  const colList = [...columns, 'refreshed_at'].join(',');
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const placeholders = chunk
      .map(
        (_, j) =>
          `(${Array.from(
            { length: colCount },
            (__, k) => `$${j * colCount + k + 1}`,
          ).join(',')})`,
      )
      .join(',');
    const values = chunk.flatMap((r) => [...toValues(r), refreshedAt]);
    try {
      await db.execute(
        `INSERT OR REPLACE INTO ${table} (${colList}) VALUES ${placeholders}`,
        values,
      );
    } catch (err) {
      console.error(`[revenue] ${table} chunk failed:`, err instanceof Error ? err.message : err);
    }
  }
}

async function persistArrTrend(rows: ArrTrendRow[], refreshedAt: string): Promise<void> {
  await bulkInsert(
    'arr_trend',
    ['month', 'country_code', 'arr_lc', 'customer_count'],
    rows,
    (r) => [r.month, r.countryCode, r.arrLc, r.customerCount],
    refreshedAt,
  );
}

async function persistResellerSeats(
  rows: ResellerSeatsRow[],
  refreshedAt: string,
): Promise<void> {
  await bulkInsert(
    'reseller_seats_trend',
    ['month', 'country_code', 'active_resellers', 'active_seats'],
    rows,
    (r) => [r.month, r.countryCode, r.activeResellers, r.activeSeats],
    refreshedAt,
  );
}

async function persistVendorSales(
  rows: VendorSalesRow[],
  refreshedAt: string,
): Promise<void> {
  await bulkInsert(
    'net_sales_by_vendor',
    ['month', 'country_code', 'vendor', 'net_sales_lc'],
    rows,
    (r) => [r.month, r.countryCode, r.vendor, r.netSalesLc],
    refreshedAt,
  );
}

export async function loadInsightsFromDb(): Promise<void> {
  try {
    const db = await getDb();
    const [trendRows, seatRows, vendorRows, refreshedAtRow] = await Promise.all([
      db.select<ArrTrendDbRow[]>(
        `SELECT month, country_code, arr_lc, customer_count FROM arr_trend ORDER BY month ASC, country_code ASC`,
      ),
      db.select<ResellerSeatsDbRow[]>(
        `SELECT month, country_code, active_resellers, active_seats FROM reseller_seats_trend ORDER BY month ASC, country_code ASC`,
      ),
      db.select<VendorSalesDbRow[]>(
        `SELECT month, country_code, vendor, net_sales_lc FROM net_sales_by_vendor ORDER BY month ASC, country_code ASC, vendor ASC`,
      ),
      db.select<{ refreshed_at: string }[]>(`SELECT refreshed_at FROM arr_trend LIMIT 1`),
    ]);

    const arrTrendRows: ArrTrendRow[] = trendRows.map((r) => ({
      month: r.month,
      countryCode: r.country_code,
      arrLc: r.arr_lc ?? 0,
      customerCount: r.customer_count ?? 0,
    }));
    const resellerSeatsRows: ResellerSeatsRow[] = seatRows.map((r) => ({
      month: r.month,
      countryCode: r.country_code,
      activeResellers: r.active_resellers ?? 0,
      activeSeats: r.active_seats ?? 0,
    }));
    const vendorSalesRows: VendorSalesRow[] = vendorRows.map((r) => ({
      month: r.month,
      countryCode: r.country_code,
      vendor: r.vendor,
      netSalesLc: r.net_sales_lc ?? 0,
    }));

    const lastRefreshedAt = refreshedAtRow[0]?.refreshed_at ?? null;

    useRevenueInsightsStore.getState().setSnapshot({
      arrTrendRows,
      resellerSeatsRows,
      vendorSalesRows,
      lastRefreshedAt,
    });
    useRevenueInsightsStore.getState().setHydrated(true);
  } catch (err) {
    console.error('[insights] hydrate failed:', err);
  }
}

export async function refreshInsightsFromPowerBi(token: string): Promise<void> {
  const refreshedAt = new Date().toISOString();

  const [trendResult, seatResult, vendorResult] = await Promise.all([
    executeDaxQuery(token, null, DATASET_ID, ARR_TREND_SNAPSHOT_DAX),
    executeDaxQuery(token, null, DATASET_ID, RESELLER_SEATS_SNAPSHOT_DAX),
    executeDaxQuery(token, null, DATASET_ID, NET_SALES_SNAPSHOT_DAX),
  ]);

  const arrTrendRows = parseArrTrend(trendResult.rows ?? []);
  const resellerSeatsRows = parseResellerSeats(seatResult.rows ?? []);
  const vendorSalesRows = parseVendorSales(vendorResult.rows ?? []);

  await Promise.all([
    persistArrTrend(arrTrendRows, refreshedAt),
    persistResellerSeats(resellerSeatsRows, refreshedAt),
    persistVendorSales(vendorSalesRows, refreshedAt),
  ]);

  useRevenueInsightsStore.getState().setSnapshot({
    arrTrendRows,
    resellerSeatsRows,
    vendorSalesRows,
    lastRefreshedAt: refreshedAt,
  });
  useRevenueInsightsStore.getState().setHydrated(true);
}
