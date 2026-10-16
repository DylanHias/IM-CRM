import { create } from 'zustand';

export interface CustomerRevenueRow {
  bcn: string;
  customerId: string | null;
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

function addNullable(a: number | null, b: number | null): number | null {
  return a === null && b === null ? null : (a ?? 0) + (b ?? 0);
}

// Several Power BI rows can share a key (one BCN, many reseller ids): sum them.
function indexByKey(
  rows: CustomerRevenueRow[],
  keyOf: (r: CustomerRevenueRow) => string | null,
): Map<string, CustomerRevenueRow> {
  const out = new Map<string, CustomerRevenueRow>();
  for (const r of rows) {
    const key = keyOf(r);
    if (!key) continue;
    const prev = out.get(key);
    out.set(
      key,
      prev
        ? { ...prev, arrLc: addNullable(prev.arrLc, r.arrLc), arrUsd: addNullable(prev.arrUsd, r.arrUsd) }
        : r,
    );
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
      byBcn: indexByKey(rows, (r) => r.bcn),
      byResellerAccount: indexByKey(rows, (r) => r.resellerAccount),
      lastRefreshedAt,
    }),
  setRefreshing: (isRefreshing) => set({ isRefreshing }),
  setHydrated: (isHydrated) => set({ isHydrated }),
}));
