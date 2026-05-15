import { create } from 'zustand';

export interface ArrTrendPoint {
  month: string;
  arrUsd: number;
  customerCount: number;
}

export interface ArrTrendEntry {
  key: string;
  monthsBack: number;
  countryCodes: readonly string[];
  points: ArrTrendPoint[];
  fetchedAt: number;
}

export function trendKey(monthsBack: number, countryCodes: readonly string[]): string {
  const codes = [...countryCodes].sort().join(',');
  return `${monthsBack}::${codes}`;
}

interface RevenueInsightsState {
  trendByKey: Map<string, ArrTrendEntry>;
  loadingKeys: Set<string>;
  errorByKey: Map<string, string>;

  setTrend: (key: string, entry: ArrTrendEntry) => void;
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
}

export const useRevenueInsightsStore = create<RevenueInsightsState>((set) => ({
  trendByKey: new Map(),
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
