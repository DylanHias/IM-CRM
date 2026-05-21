import { create } from 'zustand';

export interface ArrTrendRow {
  month: string;
  countryCode: string;
  arrLc: number;
  customerCount: number;
}

export interface ResellerSeatsRow {
  month: string;
  countryCode: string;
  activeResellers: number;
  activeSeats: number;
}

export interface VendorSalesRow {
  month: string;
  countryCode: string;
  vendor: string;
  netSalesLc: number;
}

interface RevenueInsightsState {
  arrTrendRows: ArrTrendRow[];
  resellerSeatsRows: ResellerSeatsRow[];
  vendorSalesRows: VendorSalesRow[];
  lastRefreshedAt: string | null;
  isHydrated: boolean;

  setSnapshot: (snapshot: {
    arrTrendRows: ArrTrendRow[];
    resellerSeatsRows: ResellerSeatsRow[];
    vendorSalesRows: VendorSalesRow[];
    lastRefreshedAt: string | null;
  }) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useRevenueInsightsStore = create<RevenueInsightsState>((set) => ({
  arrTrendRows: [],
  resellerSeatsRows: [],
  vendorSalesRows: [],
  lastRefreshedAt: null,
  isHydrated: false,
  setSnapshot: ({ arrTrendRows, resellerSeatsRows, vendorSalesRows, lastRefreshedAt }) =>
    set({ arrTrendRows, resellerSeatsRows, vendorSalesRows, lastRefreshedAt }),
  setHydrated: (isHydrated) => set({ isHydrated }),
}));
