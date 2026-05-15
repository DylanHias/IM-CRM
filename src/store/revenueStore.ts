import { create } from 'zustand';

export interface CustomerRevenueRow {
  bcn: string;
  pbiCustomerId: string | null;
  arrUsd: number | null;
  arrLc: number | null;
  currencyCode: string | null;
  asOfMonth: string | null;
  refreshedAt: string;
}

interface RevenueState {
  byBcn: Map<string, CustomerRevenueRow>;
  lastRefreshedAt: string | null;
  isRefreshing: boolean;
  isHydrated: boolean;
  setRevenue: (rows: CustomerRevenueRow[], lastRefreshedAt: string | null) => void;
  setRefreshing: (refreshing: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useRevenueStore = create<RevenueState>((set) => ({
  byBcn: new Map(),
  lastRefreshedAt: null,
  isRefreshing: false,
  isHydrated: false,
  setRevenue: (rows, lastRefreshedAt) =>
    set({ byBcn: new Map(rows.map((r) => [r.bcn, r])), lastRefreshedAt }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setHydrated: (isHydrated) => set({ isHydrated }),
}));
