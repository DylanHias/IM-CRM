import { create } from 'zustand';

export interface CustomerRevenueRow {
  bcn: string;
  pbiCustomerId: string | null;
  resellerAccount: string | null;
  arrUsd: number | null;
  arrLc: number | null;
  currencyCode: string | null;
  asOfMonth: string | null;
  activeEndCustomers: number | null;
  refreshedAt: string;
}

interface RevenueState {
  byBcn: Map<string, CustomerRevenueRow>;
  byResellerAccount: Map<string, CustomerRevenueRow>;
  lastRefreshedAt: string | null;
  isRefreshing: boolean;
  isHydrated: boolean;
  setRevenue: (rows: CustomerRevenueRow[], lastRefreshedAt: string | null) => void;
  setRefreshing: (refreshing: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

function indexByResellerAccount(rows: CustomerRevenueRow[]): Map<string, CustomerRevenueRow> {
  const out = new Map<string, CustomerRevenueRow>();
  for (const r of rows) {
    if (!r.resellerAccount) continue;
    out.set(r.resellerAccount, r);
  }
  return out;
}

export const useRevenueStore = create<RevenueState>((set) => ({
  byBcn: new Map(),
  byResellerAccount: new Map(),
  lastRefreshedAt: null,
  isRefreshing: false,
  isHydrated: false,
  setRevenue: (rows, lastRefreshedAt) =>
    set({
      byBcn: new Map(rows.map((r) => [r.bcn, r])),
      byResellerAccount: indexByResellerAccount(rows),
      lastRefreshedAt,
    }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setHydrated: (isHydrated) => set({ isHydrated }),
}));
