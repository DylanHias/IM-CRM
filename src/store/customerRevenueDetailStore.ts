import { create } from 'zustand';

export interface ArrMovementRow {
  bcn: string;
  month: string;
  upgradeLc: number;
  downgradeLc: number;
  cancellationLc: number;
  newSaleLc: number;
}

interface CustomerRevenueDetailState {
  movementByBcn: Map<string, ArrMovementRow[]>;
  lastRefreshedAt: string | null;
  isHydrated: boolean;

  setMovement: (rows: ArrMovementRow[], lastRefreshedAt: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
}

function indexByBcn(rows: ArrMovementRow[]): Map<string, ArrMovementRow[]> {
  const out = new Map<string, ArrMovementRow[]>();
  for (const r of rows) {
    let list = out.get(r.bcn);
    if (!list) {
      list = [];
      out.set(r.bcn, list);
    }
    list.push(r);
  }
  // Per-BCN months in ascending order so UI can trim from the tail.
  out.forEach((list: ArrMovementRow[]) => {
    list.sort((a, b) => a.month.localeCompare(b.month));
  });
  return out;
}

export const useCustomerRevenueDetailStore = create<CustomerRevenueDetailState>((set) => ({
  movementByBcn: new Map(),
  lastRefreshedAt: null,
  isHydrated: false,
  setMovement: (rows, lastRefreshedAt) =>
    set({ movementByBcn: indexByBcn(rows), lastRefreshedAt }),
  setHydrated: (isHydrated) => set({ isHydrated }),
}));
