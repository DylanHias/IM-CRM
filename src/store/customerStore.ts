import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer } from '@/types/entities';

interface CustomerState {
  customers: Customer[];
  selectedCustomerId: string | null;
  searchQuery: string;
  filterOwnerId: string | null;
  filterNoRecentActivity: boolean;
  isLoading: boolean;

  setCustomers: (customers: Customer[]) => void;
  setSelectedCustomerId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setFilterOwnerId: (id: string | null) => void;
  toggleNoRecentActivityFilter: () => void;
  setLoading: (loading: boolean) => void;
  getFilteredCustomers: () => Customer[];
  getSelectedCustomer: () => Customer | null;
}

const RECENT_ACTIVITY_THRESHOLD_DAYS = 90;

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [],
      selectedCustomerId: null,
      searchQuery: '',
      filterOwnerId: null,
      filterNoRecentActivity: false,
      isLoading: false,

      setCustomers: (customers) => set({ customers }),
      setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setFilterOwnerId: (filterOwnerId) => set({ filterOwnerId }),
      toggleNoRecentActivityFilter: () =>
        set((s) => ({ filterNoRecentActivity: !s.filterNoRecentActivity })),
      setLoading: (isLoading) => set({ isLoading }),

      getFilteredCustomers: () => {
        const { customers, searchQuery, filterOwnerId, filterNoRecentActivity } = get();
        let result = customers;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          result = result.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.accountNumber?.toLowerCase().includes(q) ||
              c.addressCity?.toLowerCase().includes(q)
          );
        }

        if (filterOwnerId) {
          result = result.filter((c) => c.ownerId === filterOwnerId);
        }

        if (filterNoRecentActivity) {
          const cutoff = new Date(
            Date.now() - RECENT_ACTIVITY_THRESHOLD_DAYS * 86400000
          ).toISOString();
          result = result.filter(
            (c) => !c.lastActivityAt || c.lastActivityAt < cutoff
          );
        }

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
        filterOwnerId: state.filterOwnerId,
        filterNoRecentActivity: state.filterNoRecentActivity,
      }),
    }
  )
);
