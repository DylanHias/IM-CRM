import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Opportunity } from '@/types/entities';

export type OppSortBy = 'createdAt' | 'subject' | 'estimatedRevenue' | 'expirationDate' | 'stage';
export type SortDir = 'asc' | 'desc';

const STAGE_ORDER: Record<string, number> = {
  'Prospecting': 1,
  'Validated': 2,
  'Qualified': 3,
  'Verbal Received': 4,
  'Contract Received': 5,
  'Billing Rejection': 6,
  'Pending Vendor Confirmation': 7,
  'Purchased': 8,
};

interface OpportunityListState {
  opportunities: Opportunity[];
  customerMap: Map<string, string>;
  searchQuery: string;
  sortBy: OppSortBy;
  sortDir: SortDir;
  filterCustomerId: string | null;
  filterStage: string | null;
  page: number;
  isLoading: boolean;

  setOpportunities: (opps: Opportunity[]) => void;
  setCustomerMap: (map: Map<string, string>) => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (s: OppSortBy) => void;
  setSortDir: (d: SortDir) => void;
  setFilterCustomerId: (id: string | null) => void;
  setFilterStage: (s: string | null) => void;
  setPage: (page: number) => void;
  setLoading: (loading: boolean) => void;
  clearFilters: () => void;
  getActiveFilterCount: () => number;
  getFilteredOpportunities: () => Opportunity[];
}

export const useOpportunityListStore = create<OpportunityListState>()(
  persist(
    (set, get) => ({
      opportunities: [],
      customerMap: new Map(),
      searchQuery: '',
      sortBy: 'createdAt',
      sortDir: 'desc',
      filterCustomerId: null,
      filterStage: null,
      page: 1,
      isLoading: false,

      setOpportunities: (opportunities) => set({ opportunities }),
      setCustomerMap: (customerMap) => set({ customerMap }),
      setSearchQuery: (searchQuery) => set({ searchQuery, page: 1 }),
      setSortBy: (sortBy) => set({ sortBy, page: 1 }),
      setSortDir: (sortDir) => set({ sortDir, page: 1 }),
      setFilterCustomerId: (filterCustomerId) => set({ filterCustomerId, page: 1 }),
      setFilterStage: (filterStage) => set({ filterStage, page: 1 }),
      setPage: (page) => set({ page }),
      setLoading: (isLoading) => set({ isLoading }),

      clearFilters: () => set({
        filterCustomerId: null,
        filterStage: null,
        page: 1,
      }),

      getActiveFilterCount: () => {
        const { filterCustomerId, filterStage } = get();
        return [filterCustomerId, filterStage].filter(Boolean).length;
      },

      getFilteredOpportunities: () => {
        const { opportunities, customerMap, searchQuery, sortBy, sortDir, filterCustomerId, filterStage } = get();

        let result = opportunities;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          result = result.filter((o) => {
            const companyName = customerMap.get(o.customerId) ?? '';
            return (
              o.subject.toLowerCase().includes(q) ||
              companyName.toLowerCase().includes(q) ||
              (o.primaryVendor ?? '').toLowerCase().includes(q)
            );
          });
        }

        if (filterCustomerId) {
          result = result.filter((o) => o.customerId === filterCustomerId);
        }
        if (filterStage) {
          result = result.filter((o) => o.stage === filterStage);
        }

        result = [...result].sort((a, b) => {
          let cmp = 0;
          if (sortBy === 'subject') {
            cmp = a.subject.localeCompare(b.subject);
          } else if (sortBy === 'estimatedRevenue') {
            cmp = (a.estimatedRevenue ?? 0) - (b.estimatedRevenue ?? 0);
          } else if (sortBy === 'expirationDate') {
            const aDate = a.expirationDate ?? '9999';
            const bDate = b.expirationDate ?? '9999';
            cmp = aDate.localeCompare(bDate);
          } else if (sortBy === 'stage') {
            cmp = (STAGE_ORDER[a.stage] ?? 99) - (STAGE_ORDER[b.stage] ?? 99);
          } else {
            cmp = a.createdAt.localeCompare(b.createdAt);
          }
          return sortDir === 'asc' ? cmp : -cmp;
        });

        return result;
      },
    }),
    {
      name: 'crm-opportunity-list-store',
      partialize: (state) => ({
        sortBy: state.sortBy,
        sortDir: state.sortDir,
        filterCustomerId: state.filterCustomerId,
        filterStage: state.filterStage,
      }),
    }
  )
);
