import { create } from 'zustand';

export interface ArrTrendPoint {
  month: string;
  arrUsd: number;
  customerCount: number;
}

export interface ArrTrendEntry {
  monthsBack: number;
  points: ArrTrendPoint[];
  fetchedAt: number;
}

interface RevenueInsightsState {
  trendByMonths: Map<number, ArrTrendEntry>;
  loadingMonths: Set<number>;
  errorByMonths: Map<number, string>;

  setTrend: (monthsBack: number, entry: ArrTrendEntry) => void;
  setLoading: (monthsBack: number, loading: boolean) => void;
  setError: (monthsBack: number, error: string | null) => void;
}

export const useRevenueInsightsStore = create<RevenueInsightsState>((set) => ({
  trendByMonths: new Map(),
  loadingMonths: new Set(),
  errorByMonths: new Map(),

  setTrend: (monthsBack, entry) =>
    set((s) => {
      const next = new Map(s.trendByMonths);
      next.set(monthsBack, entry);
      const nextErr = new Map(s.errorByMonths);
      nextErr.delete(monthsBack);
      return { trendByMonths: next, errorByMonths: nextErr };
    }),
  setLoading: (monthsBack, loading) =>
    set((s) => {
      const next = new Set(s.loadingMonths);
      if (loading) next.add(monthsBack);
      else next.delete(monthsBack);
      return { loadingMonths: next };
    }),
  setError: (monthsBack, error) =>
    set((s) => {
      const next = new Map(s.errorByMonths);
      if (error) next.set(monthsBack, error);
      else next.delete(monthsBack);
      return { errorByMonths: next };
    }),
}));
