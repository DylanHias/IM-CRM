import { executeDaxQuery } from './client';
import { arrTrendDax, netSalesByVendorDax, resellerSeatsTrendDax } from './queries';
import { getDb } from '@/lib/db/client';
import {
  useRevenueInsightsStore,
  trendKey,
  vendorSalesKey,
  type ArrTrendPoint,
  type NetSalesByVendorEntry,
  type ResellerSeatsTrendPoint,
  type VendorMonthlySales,
} from '@/store/revenueInsightsStore';

const WORKSPACE_ID = process.env.NEXT_PUBLIC_POWERBI_WORKSPACE_ID ?? '';
const DATASET_ID =
  process.env.NEXT_PUBLIC_POWERBI_DATASET_ID ?? '44da76a4-3c3f-44a8-abe9-48ff17247cc9';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes — org-wide trend changes slowly

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

function countryCodesKey(countryCodes: readonly string[]): string {
  return [...countryCodes].sort().join(',');
}

function parseRows(rows: Record<string, unknown>[]): ArrTrendPoint[] {
  const out = rows.map((r) => ({
    month: toMonthIso(r['ARR[calendar_month]']),
    arrLc: toNum(r['[ARR_LC]']),
    customerCount: toNum(r['[CustomerCount]']),
  }));
  out.sort((a, b) => a.month.localeCompare(b.month));
  return out;
}

interface ArrTrendDbRow {
  months_back: number;
  country_codes: string;
  month: string;
  arr_lc: number | null;
  customer_count: number | null;
  refreshed_at: string;
}

async function persistArrTrend(
  monthsBack: number,
  countryCodes: readonly string[],
  points: ArrTrendPoint[],
  refreshedAt: string,
): Promise<void> {
  const db = await getDb();
  const codes = countryCodesKey(countryCodes);
  try {
    await db.execute(
      `DELETE FROM arr_trend WHERE months_back = $1 AND country_codes = $2`,
      [monthsBack, codes],
    );
    for (const p of points) {
      await db.execute(
        `INSERT OR REPLACE INTO arr_trend
          (months_back, country_codes, month, arr_lc, customer_count, refreshed_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [monthsBack, codes, p.month, p.arrLc, p.customerCount, refreshedAt],
      );
    }
  } catch (err) {
    console.error('[insights] persist ARR trend failed:', err);
  }
}

export async function loadArrTrendFromDb(
  monthsBack: number,
  countryCodes: readonly string[],
): Promise<ArrTrendPoint[] | null> {
  try {
    const db = await getDb();
    const codes = countryCodesKey(countryCodes);
    const rows = await db.select<ArrTrendDbRow[]>(
      `SELECT months_back, country_codes, month, arr_lc, customer_count, refreshed_at
       FROM arr_trend
       WHERE months_back = $1 AND country_codes = $2
       ORDER BY month ASC`,
      [monthsBack, codes],
    );
    if (rows.length === 0) return null;
    const points: ArrTrendPoint[] = rows.map((r) => ({
      month: r.month,
      arrLc: r.arr_lc ?? 0,
      customerCount: r.customer_count ?? 0,
    }));
    const key = trendKey(monthsBack, countryCodes);
    const fetchedAt = new Date(rows[0].refreshed_at).getTime();
    useRevenueInsightsStore.getState().setTrend(key, {
      key,
      monthsBack,
      countryCodes,
      points,
      fetchedAt: Number.isFinite(fetchedAt) ? fetchedAt : Date.now(),
    });
    return points;
  } catch (err) {
    console.error('[insights] load ARR trend from DB failed:', err);
    return null;
  }
}

export async function fetchArrTrend(
  token: string,
  monthsBack: number,
  countryCodes: readonly string[],
  force = false,
): Promise<ArrTrendPoint[]> {
  const key = trendKey(monthsBack, countryCodes);
  const store = useRevenueInsightsStore.getState();

  const cached = store.trendByKey.get(key);
  if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.points;
  }

  if (store.loadingKeys.has(key)) {
    return new Promise((resolve) => {
      const unsub = useRevenueInsightsStore.subscribe((s) => {
        if (!s.loadingKeys.has(key)) {
          unsub();
          resolve(s.trendByKey.get(key)?.points ?? []);
        }
      });
    });
  }

  store.setLoading(key, true);
  store.setError(key, null);
  try {
    const dax = arrTrendDax(monthsBack, countryCodes);
    const result = await executeDaxQuery(token, WORKSPACE_ID || null, DATASET_ID, dax);
    const points = parseRows(result.rows ?? []);
    const refreshedAt = new Date().toISOString();
    store.setTrend(key, { key, monthsBack, countryCodes, points, fetchedAt: Date.now() });
    await persistArrTrend(monthsBack, countryCodes, points, refreshedAt);
    return points;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[insights] ARR trend fetch failed:', msg);
    store.setError(key, msg);
    throw err;
  } finally {
    store.setLoading(key, false);
  }
}

function parseResellerSeatsRows(rows: Record<string, unknown>[]): ResellerSeatsTrendPoint[] {
  const out = rows.map((r) => ({
    month: toMonthIso(r['Seats[month]']),
    activeResellers: toNum(r['[ActiveResellers]']),
    activeSeats: toNum(r['[ActiveSeats]']),
  }));
  out.sort((a, b) => a.month.localeCompare(b.month));
  return out;
}

interface ResellerSeatsDbRow {
  months_back: number;
  country_codes: string;
  month: string;
  active_resellers: number | null;
  active_seats: number | null;
  refreshed_at: string;
}

async function persistResellerSeats(
  monthsBack: number,
  countryCodes: readonly string[],
  points: ResellerSeatsTrendPoint[],
  refreshedAt: string,
): Promise<void> {
  const db = await getDb();
  const codes = countryCodesKey(countryCodes);
  try {
    await db.execute(
      `DELETE FROM reseller_seats_trend WHERE months_back = $1 AND country_codes = $2`,
      [monthsBack, codes],
    );
    for (const p of points) {
      await db.execute(
        `INSERT OR REPLACE INTO reseller_seats_trend
          (months_back, country_codes, month, active_resellers, active_seats, refreshed_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [monthsBack, codes, p.month, p.activeResellers, p.activeSeats, refreshedAt],
      );
    }
  } catch (err) {
    console.error('[insights] persist reseller seats failed:', err);
  }
}

export async function loadResellerSeatsTrendFromDb(
  monthsBack: number,
  countryCodes: readonly string[],
): Promise<ResellerSeatsTrendPoint[] | null> {
  try {
    const db = await getDb();
    const codes = countryCodesKey(countryCodes);
    const rows = await db.select<ResellerSeatsDbRow[]>(
      `SELECT months_back, country_codes, month, active_resellers, active_seats, refreshed_at
       FROM reseller_seats_trend
       WHERE months_back = $1 AND country_codes = $2
       ORDER BY month ASC`,
      [monthsBack, codes],
    );
    if (rows.length === 0) return null;
    const points: ResellerSeatsTrendPoint[] = rows.map((r) => ({
      month: r.month,
      activeResellers: r.active_resellers ?? 0,
      activeSeats: r.active_seats ?? 0,
    }));
    const key = `seats::${trendKey(monthsBack, countryCodes)}`;
    const fetchedAt = new Date(rows[0].refreshed_at).getTime();
    useRevenueInsightsStore.getState().setResellerSeats(key, {
      key,
      monthsBack,
      countryCodes,
      points,
      fetchedAt: Number.isFinite(fetchedAt) ? fetchedAt : Date.now(),
    });
    return points;
  } catch (err) {
    console.error('[insights] load reseller seats from DB failed:', err);
    return null;
  }
}

export async function fetchResellerSeatsTrend(
  token: string,
  monthsBack: number,
  countryCodes: readonly string[],
  force = false,
): Promise<ResellerSeatsTrendPoint[]> {
  const key = `seats::${trendKey(monthsBack, countryCodes)}`;
  const store = useRevenueInsightsStore.getState();

  const cached = store.resellerSeatsByKey.get(key);
  if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.points;
  }

  if (store.loadingKeys.has(key)) {
    return new Promise((resolve) => {
      const unsub = useRevenueInsightsStore.subscribe((s) => {
        if (!s.loadingKeys.has(key)) {
          unsub();
          resolve(s.resellerSeatsByKey.get(key)?.points ?? []);
        }
      });
    });
  }

  store.setLoading(key, true);
  store.setError(key, null);
  try {
    const dax = resellerSeatsTrendDax(monthsBack, countryCodes);
    const result = await executeDaxQuery(token, WORKSPACE_ID || null, DATASET_ID, dax);
    const points = parseResellerSeatsRows(result.rows ?? []);
    const refreshedAt = new Date().toISOString();
    store.setResellerSeats(key, {
      key,
      monthsBack,
      countryCodes,
      points,
      fetchedAt: Date.now(),
    });
    await persistResellerSeats(monthsBack, countryCodes, points, refreshedAt);
    return points;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[insights] Reseller/seats trend fetch failed:', msg);
    store.setError(key, msg);
    throw err;
  } finally {
    store.setLoading(key, false);
  }
}

function parseVendorSalesRows(
  rows: Record<string, unknown>[],
): { months: string[]; vendors: VendorMonthlySales[] } {
  const monthSet = new Set<string>();
  const byVendor = new Map<string, VendorMonthlySales>();

  for (const r of rows) {
    const vendor = String(r['Vendor[vendor_name]'] ?? '').trim();
    const month = toMonthIso(r['Sales[month]']);
    const value = toNum(r['[NetSales_LC]']);
    if (!vendor || !month) continue;
    monthSet.add(month);
    let v = byVendor.get(vendor);
    if (!v) {
      v = { vendor, totalLc: 0, pointsByMonth: new Map() };
      byVendor.set(vendor, v);
    }
    v.totalLc += value;
    v.pointsByMonth.set(month, (v.pointsByMonth.get(month) ?? 0) + value);
  }

  const months = Array.from(monthSet).sort();
  const vendors = Array.from(byVendor.values()).sort((a, b) => b.totalLc - a.totalLc);
  return { months, vendors };
}

interface VendorSalesDbRow {
  months_back: number;
  country_codes: string;
  top_n: number;
  vendor: string;
  month: string;
  net_sales_lc: number | null;
  refreshed_at: string;
}

async function persistVendorSales(
  monthsBack: number,
  countryCodes: readonly string[],
  topN: number,
  months: string[],
  vendors: VendorMonthlySales[],
  refreshedAt: string,
): Promise<void> {
  const db = await getDb();
  const codes = countryCodesKey(countryCodes);
  try {
    await db.execute(
      `DELETE FROM net_sales_by_vendor
       WHERE months_back = $1 AND country_codes = $2 AND top_n = $3`,
      [monthsBack, codes, topN],
    );
    for (const v of vendors) {
      for (const month of months) {
        const value = v.pointsByMonth.get(month);
        if (value === undefined) continue;
        await db.execute(
          `INSERT OR REPLACE INTO net_sales_by_vendor
            (months_back, country_codes, top_n, vendor, month, net_sales_lc, refreshed_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [monthsBack, codes, topN, v.vendor, month, value, refreshedAt],
        );
      }
    }
  } catch (err) {
    console.error('[insights] persist net sales by vendor failed:', err);
  }
}

export async function loadNetSalesByVendorFromDb(
  monthsBack: number,
  countryCodes: readonly string[],
  topN: number,
): Promise<NetSalesByVendorEntry | null> {
  try {
    const db = await getDb();
    const codes = countryCodesKey(countryCodes);
    const rows = await db.select<VendorSalesDbRow[]>(
      `SELECT months_back, country_codes, top_n, vendor, month, net_sales_lc, refreshed_at
       FROM net_sales_by_vendor
       WHERE months_back = $1 AND country_codes = $2 AND top_n = $3
       ORDER BY vendor ASC, month ASC`,
      [monthsBack, codes, topN],
    );
    if (rows.length === 0) return null;

    const monthSet = new Set<string>();
    const byVendor = new Map<string, VendorMonthlySales>();
    for (const r of rows) {
      monthSet.add(r.month);
      let v = byVendor.get(r.vendor);
      if (!v) {
        v = { vendor: r.vendor, totalLc: 0, pointsByMonth: new Map() };
        byVendor.set(r.vendor, v);
      }
      const value = r.net_sales_lc ?? 0;
      v.totalLc += value;
      v.pointsByMonth.set(r.month, value);
    }
    const months = Array.from(monthSet).sort();
    const vendors = Array.from(byVendor.values()).sort((a, b) => b.totalLc - a.totalLc);

    const key = `vendorSales::${vendorSalesKey(monthsBack, countryCodes, topN)}`;
    const fetchedAt = new Date(rows[0].refreshed_at).getTime();
    const entry: NetSalesByVendorEntry = {
      key,
      monthsBack,
      countryCodes,
      topN,
      months,
      vendors,
      fetchedAt: Number.isFinite(fetchedAt) ? fetchedAt : Date.now(),
    };
    useRevenueInsightsStore.getState().setVendorSales(key, entry);
    return entry;
  } catch (err) {
    console.error('[insights] load net sales by vendor from DB failed:', err);
    return null;
  }
}

export async function fetchNetSalesByVendor(
  token: string,
  monthsBack: number,
  countryCodes: readonly string[],
  topN: number,
  force = false,
): Promise<NetSalesByVendorEntry> {
  const key = `vendorSales::${vendorSalesKey(monthsBack, countryCodes, topN)}`;
  const store = useRevenueInsightsStore.getState();

  const cached = store.vendorSalesByKey.get(key);
  if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached;
  }

  if (store.loadingKeys.has(key)) {
    return new Promise((resolve) => {
      const unsub = useRevenueInsightsStore.subscribe((s) => {
        if (!s.loadingKeys.has(key)) {
          unsub();
          const entry = s.vendorSalesByKey.get(key);
          resolve(
            entry ?? {
              key,
              monthsBack,
              countryCodes,
              topN,
              months: [],
              vendors: [],
              fetchedAt: Date.now(),
            },
          );
        }
      });
    });
  }

  store.setLoading(key, true);
  store.setError(key, null);
  try {
    const dax = netSalesByVendorDax(monthsBack, countryCodes, topN);
    const result = await executeDaxQuery(token, WORKSPACE_ID || null, DATASET_ID, dax);
    const { months, vendors } = parseVendorSalesRows(result.rows ?? []);
    const refreshedAt = new Date().toISOString();
    const entry: NetSalesByVendorEntry = {
      key,
      monthsBack,
      countryCodes,
      topN,
      months,
      vendors,
      fetchedAt: Date.now(),
    };
    store.setVendorSales(key, entry);
    await persistVendorSales(monthsBack, countryCodes, topN, months, vendors, refreshedAt);
    return entry;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[insights] Net sales by vendor fetch failed:', msg);
    store.setError(key, msg);
    throw err;
  } finally {
    store.setLoading(key, false);
  }
}
