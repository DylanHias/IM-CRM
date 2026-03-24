import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer, Contact } from '@/types/entities';
import { useSettingsStore } from '@/store/settingsStore';

export type SortBy = 'name' | 'lastActivity' | 'city' | 'industry';
export type SortDir = 'asc' | 'desc';

interface CustomerState {
  customers: Customer[];
  allContacts: Contact[];
  selectedCustomerId: string | null;
  searchQuery: string;
  sortBy: SortBy;
  sortDir: SortDir;
  filterOwnerId: string | null;
  filterStatus: 'all' | 'active' | 'inactive';
  filterIndustry: string | null;
  filterSegment: string | null;
  filterCountry: string | null;
  filterNoRecentActivity: boolean;
  isLoading: boolean;

  setCustomers: (customers: Customer[]) => void;
  setAllContacts: (contacts: Contact[]) => void;
  setSelectedCustomerId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (s: SortBy) => void;
  setSortDir: (d: SortDir) => void;
  setFilterOwnerId: (id: string | null) => void;
  setFilterStatus: (s: 'all' | 'active' | 'inactive') => void;
  setFilterIndustry: (i: string | null) => void;
  setFilterSegment: (s: string | null) => void;
  setFilterCountry: (c: string | null) => void;
  toggleNoRecentActivityFilter: () => void;
  setLoading: (loading: boolean) => void;
  clearFilters: () => void;
  getActiveFilterCount: () => number;
  getFilteredCustomers: () => Customer[];
  getSelectedCustomer: () => Customer | null;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      allContacts: [],
      selectedCustomerId: null,
      searchQuery: '',
      sortBy: 'lastActivity',
      sortDir: 'desc',
      filterOwnerId: null,
      filterStatus: 'all',
      filterIndustry: null,
      filterSegment: null,
      filterCountry: null,
      filterNoRecentActivity: false,
      isLoading: false,

      setCustomers: (customers) => set({ customers }),
      setAllContacts: (allContacts) => set({ allContacts }),
      setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortDir: (sortDir) => set({ sortDir }),
      setFilterOwnerId: (filterOwnerId) => set({ filterOwnerId }),
      setFilterStatus: (filterStatus) => set({ filterStatus }),
      setFilterIndustry: (filterIndustry) => set({ filterIndustry }),
      setFilterSegment: (filterSegment) => set({ filterSegment }),
      setFilterCountry: (filterCountry) => set({ filterCountry }),
      toggleNoRecentActivityFilter: () =>
        set((s) => ({ filterNoRecentActivity: !s.filterNoRecentActivity })),
      setLoading: (isLoading) => set({ isLoading }),

      clearFilters: () => set({
        filterOwnerId: null,
        filterStatus: 'all',
        filterIndustry: null,
        filterSegment: null,
        filterCountry: null,
        filterNoRecentActivity: false,
      }),

      getActiveFilterCount: () => {
        const { filterOwnerId, filterStatus, filterIndustry, filterSegment, filterCountry, filterNoRecentActivity } = get();
        return [filterOwnerId, filterStatus !== 'all', filterIndustry, filterSegment, filterCountry, filterNoRecentActivity]
          .filter(Boolean).length;
      },

      getFilteredCustomers: () => {
        const {
          customers, allContacts, searchQuery, sortBy, sortDir,
          filterOwnerId, filterStatus, filterIndustry, filterSegment, filterCountry, filterNoRecentActivity,
        } = get();

        let result = customers;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchingCustomerIds = new Set(
            allContacts
              .filter((c) =>
                `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.jobTitle?.toLowerCase().includes(q)
              )
              .map((c) => c.customerId)
          );
          result = result.filter((c) =>
            c.name.toLowerCase().includes(q) ||
            c.accountNumber?.toLowerCase().includes(q) ||
            c.addressCity?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.industry?.toLowerCase().includes(q) ||
            matchingCustomerIds.has(c.id)
          );
        }

        if (filterStatus !== 'all') {
          result = result.filter((c) => c.status === filterStatus);
        }
        if (filterOwnerId) {
          result = result.filter((c) => c.ownerId === filterOwnerId);
        }
        if (filterIndustry) {
          result = result.filter((c) => c.industry === filterIndustry);
        }
        if (filterSegment) {
          result = result.filter((c) => c.segment === filterSegment);
        }
        if (filterCountry) {
          result = result.filter((c) => c.addressCountry === filterCountry);
        }
        if (filterNoRecentActivity) {
          const thresholdDays = useSettingsStore.getState().noRecentActivityDays;
          const cutoff = new Date(Date.now() - thresholdDays * 86400000).toISOString();
          result = result.filter((c) => !c.lastActivityAt || c.lastActivityAt < cutoff);
        }

        result = [...result].sort((a, b) => {
          let cmp = 0;
          if (sortBy === 'name') {
            cmp = a.name.localeCompare(b.name);
          } else if (sortBy === 'city') {
            cmp = (a.addressCity ?? '').localeCompare(b.addressCity ?? '');
          } else if (sortBy === 'industry') {
            cmp = (a.industry ?? '').localeCompare(b.industry ?? '');
          } else {
            // lastActivity: null treated as oldest
            const aDate = a.lastActivityAt ?? '0000';
            const bDate = b.lastActivityAt ?? '0000';
            cmp = aDate.localeCompare(bDate);
          }
          return sortDir === 'asc' ? cmp : -cmp;
        });

        return result;
      },

      getSelectedCustomer: () => {
        const { customers, selectedCustomerId } = get();
        return customers.find((c) => c.id === selectedCustomerId) ?? null;
      },
    }),
    {
      name: 'crm-customer-store',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        sortBy: state.sortBy,
        sortDir: state.sortDir,
        filterOwnerId: state.filterOwnerId,
        filterStatus: state.filterStatus,
        filterIndustry: state.filterIndustry,
        filterSegment: state.filterSegment,
        filterCountry: state.filterCountry,
        filterNoRecentActivity: state.filterNoRecentActivity,
      }),
    }
  )
);
