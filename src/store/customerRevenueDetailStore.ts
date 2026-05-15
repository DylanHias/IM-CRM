import { create } from 'zustand';

export interface ArrMovementRow {
  month: string;
  upgradeUsd: number;
  downgradeUsd: number;
  cancellationUsd: number;
  newSaleUsd: number;
  upgradeLc: number;
  downgradeLc: number;
  cancellationLc: number;
  newSaleLc: number;
}

export interface ArrMovementEntry {
  bcn: string;
  monthsBack: number;
  rows: ArrMovementRow[];
  fetchedAt: number;
}

interface CustomerRevenueDetailState {
  movementByKey: Map<string, ArrMovementEntry>;
  loadingKeys: Set<string>;
  errorByKey: Map<string, string>;

  setMovement: (key: string, entry: ArrMovementEntry) => void;
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: string | null) => void;
}

export function movementKey(bcn: string, monthsBack: number): string {
  return `${bcn}::${monthsBack}`;
}

export const useCustomerRevenueDetailStore = create<CustomerRevenueDetailState>((set) => ({
  movementByKey: new Map(),
  loadingKeys: new Set(),
  errorByKey: new Map(),

  setMovement: (key, entry) =>
    set((s) => {
      const next = new Map(s.movementByKey);
      next.set(key, entry);
      const nextErr = new Map(s.errorByKey);
      nextErr.delete(key);
      return { movementByKey: next, errorByKey: nextErr };
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
