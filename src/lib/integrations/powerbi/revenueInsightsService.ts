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

async function persistArrTrend(rows: ArrTrendRow[], refreshedAt: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM arr_trend`);
  for (const r of rows) {
    await db.execute(
      `INSERT OR REPLACE INTO arr_trend (month, country_code, arr_lc, customer_count, refreshed_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [r.month, r.countryCode, r.arrLc, r.customerCount, refreshedAt],
    );
  }
}

async function persistResellerSeats(
  rows: ResellerSeatsRow[],
  refreshedAt: string,
): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM reseller_seats_trend`);
  for (const r of rows) {
    await db.execute(
      `INSERT OR REPLACE INTO reseller_seats_trend
        (month, country_code, active_resellers, active_seats, refreshed_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [r.month, r.countryCode, r.activeResellers, r.activeSeats, refreshedAt],
    );
  }
}

async function persistVendorSales(
  rows: VendorSalesRow[],
  refreshedAt: string,
): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM net_sales_by_vendor`);
  for (const r of rows) {
    await db.execute(
      `INSERT OR REPLACE INTO net_sales_by_vendor
        (month, country_code, vendor, net_sales_lc, refreshed_at)
       VALUES ($1,$2,$3,$4,$5)`,
      [r.month, r.countryCode, r.vendor, r.netSalesLc, refreshedAt],
    );
  }
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
    executeDaxQuery(token, WORKSPACE_ID || null, DATASET_ID, ARR_TREND_SNAPSHOT_DAX),
    executeDaxQuery(token, WORKSPACE_ID || null, DATASET_ID, RESELLER_SEATS_SNAPSHOT_DAX),
    executeDaxQuery(token, WORKSPACE_ID || null, DATASET_ID, NET_SALES_SNAPSHOT_DAX),
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
