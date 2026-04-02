import { create } from 'zustand';
import type { InvoiceSearchItem, InvoiceDetail, InvoiceSearchParams } from '@/types/invoice';

interface InvoiceState {
  invoices: InvoiceSearchItem[];
  selectedDetail: InvoiceDetail | null;
  isLoading: boolean;
  isLoadingDetail: boolean;
  totalRecords: number;
  currentPage: number;
  pageSize: number;
  searchFilters: InvoiceSearchParams;
  error: string | null;

  setInvoices: (invoices: InvoiceSearchItem[], total: number, page: number) => void;
  setDetail: (detail: InvoiceDetail | null) => void;
  setLoading: (loading: boolean) => void;
  setLoadingDetail: (loading: boolean) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setFilters: (filters: InvoiceSearchParams) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useInvoiceStore = create<InvoiceState>((set) => ({
  invoices: [],
  selectedDetail: null,
  isLoading: false,
  isLoadingDetail: false,
  totalRecords: 0,
  currentPage: 1,
  pageSize: 10,
  searchFilters: {},
  error: null,

  setInvoices: (invoices, totalRecords, currentPage) =>
    set({ invoices, totalRecords, currentPage }),

  setDetail: (selectedDetail) => set({ selectedDetail }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoadingDetail: (isLoadingDetail) => set({ isLoadingDetail }),
  setPage: (currentPage) => set({ currentPage }),
  setPageSize: (pageSize) => set({ pageSize, currentPage: 1 }),
  setFilters: (searchFilters) => set({ searchFilters, currentPage: 1 }),
  setError: (error) => set({ error }),
  reset: () => set({ invoices: [], selectedDetail: null, totalRecords: 0, currentPage: 1, searchFilters: {}, error: null }),
}));
