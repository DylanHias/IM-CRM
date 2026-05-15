import { create } from 'zustand';

export interface ArrTrendPoint {
  month: string;
  arrLc: number;
  customerCount: number;
}

export interface ArrTrendEntry {
  key: string;
  monthsBack: number;
  countryCodes: readonly string[];
  points: ArrTrendPoint[];
  fetchedAt: number;
}

export interface ResellerSeatsTrendPoint {
  month: string;
  activeResellers: number;
  activeSeats: number;
}

export interface ResellerSeatsTrendEntry {
  key: string;
  monthsBack: number;
  countryCodes: readonly string[];
  points: ResellerSeatsTrendPoint[];
  fetchedAt: number;
}

export interface VendorMonthlySales {
  vendor: string;
  totalLc: number;
  pointsByMonth: Map<string, number>;
}

export interface NetSalesByVendorEntry {
  key: string;
  monthsBack: number;
  countryCodes: readonly string[];
  topN: number;
  months: string[];
  vendors: VendorMonthlySales[];
  fetchedAt: number;
}

export function trendKey(monthsBack: number, countryCodes: readonly string[]): string {
  const codes = [...countryCodes].sort().join(',');
  return `${monthsBack}::${codes}`;
}

export function vendorSalesKey(
  monthsBack: number,
  countryCodes: readonly string[],
  topN: number,
): string {
  return `${trendKey(monthsBack, countryCodes)}::top${topN}`;
}

interface RevenueInsightsState {
  trendByKey: Map<string, ArrTrendEntry>;
  resellerSeatsByKey: Map<string, ResellerSeatsTrendEntry>;
  vendorSalesByKey: Map<string, NetSalesByVendorEntry>;
  loadingKeys: Set<string>;
  errorByKey: Map<string, string>;

  setTrend: (key: string, entry: ArrTrendEntry) => void;
  setResellerSeats: (key: string, entry: ResellerSeatsTrendEntry) => void;
  setVendorSales: (key: string, entry: NetSalesByVendorEntry) => void;
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
}

export const useRevenueInsightsStore = create<RevenueInsightsState>((set) => ({
  trendByKey: new Map(),
  resellerSeatsByKey: new Map(),
  vendorSalesByKey: new Map(),
  loadingKeys: new Set(),
  errorByKey: new Map(),

  setTrend: (key, entry) =>
    set((s) => {
      const next = new Map(s.trendByKey);
      next.set(key, entry);
      const nextErr = new Map(s.errorByKey);
      nextErr.delete(key);
      return { trendByKey: next, errorByKey: nextErr };
    }),
  setResellerSeats: (key, entry) =>
    set((s) => {
      const next = new Map(s.resellerSeatsByKey);
      next.set(key, entry);
      const nextErr = new Map(s.errorByKey);
      nextErr.delete(key);
      return { resellerSeatsByKey: next, errorByKey: nextErr };
    }),
  setVendorSales: (key, entry) =>
    set((s) => {
      const next = new Map(s.vendorSalesByKey);
      next.set(key, entry);
      const nextErr = new Map(s.errorByKey);
      nextErr.delete(key);
      return { vendorSalesByKey: next, errorByKey: nextErr };
    }),
  setLoading: (key, loading) =>
    set((s) => {
      const next = new Set(s.loadingKeys);
      if (loading) next.add(key);
      else next.delete(key);
      return { loadingKeys: next };
    }),
  setError: (key, error) =>
    set((s) => {
      const next = new Map(s.errorByKey);
      if (error) next.set(key, error);
      else next.delete(key);
      return { errorByKey: next };
    }),
}));
