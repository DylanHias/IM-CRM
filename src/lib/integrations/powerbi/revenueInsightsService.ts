import { executeDaxQuery } from './client';
import { arrTrendDax, netSalesByVendorDax, resellerSeatsTrendDax } from './queries';
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

function parseRows(rows: Record<string, unknown>[]): ArrTrendPoint[] {
  const out = rows.map((r) => ({
    month: toMonthIso(r['ARR[calendar_month]']),
    arrLc: toNum(r['[ARR_LC]']),
    customerCount: toNum(r['[CustomerCount]']),
  }));
  out.sort((a, b) => a.month.localeCompare(b.month));
  return out;
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
    store.setTrend(key, { key, monthsBack, countryCodes, points, fetchedAt: Date.now() });
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
    store.setResellerSeats(key, {
      key,
      monthsBack,
      countryCodes,
      points,
      fetchedAt: Date.now(),
    });
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
