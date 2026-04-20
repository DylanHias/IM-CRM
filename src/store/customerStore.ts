import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer, Contact } from '@/types/entities';
import { useSettingsStore } from '@/store/settingsStore';
import { addCustomerFavorite, removeCustomerFavorite } from '@/lib/db/queries/customers';
import { normalizeCity } from '@/lib/utils/cityProvince';
import { healthTier, type HealthTier } from '@/lib/customers/healthScore';

export type SortBy = 'name' | 'lastActivity' | 'city' | 'industry' | 'health';
export type SortDir = 'asc' | 'desc';

interface CustomerState {
  customers: Customer[];
  allContacts: Contact[];
  selectedCustomerId: string | null;
  favoriteIds: Set<string>;
  searchQuery: string;
  sortBy: SortBy;
  sortDir: SortDir;
  filterOwnerId: string | null;
  filterStatus: 'all' | 'active' | 'inactive';
  filterIndustry: string | null;
  filterSegment: string | null;
  filterCountry: string | null;
  filterCity: string | null;
  filterNoRecentActivity: boolean;
  filterFavorites: boolean;
  filterHealthTier: HealthTier | null;
  page: number;
  isLoading: boolean;

  setCustomers: (customers: Customer[]) => void;
  setAllContacts: (contacts: Contact[]) => void;
  setSelectedCustomerId: (id: string | null) => void;
  setFavoriteIds: (ids: Set<string>) => void;
  toggleFavorite: (id: string) => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (s: SortBy) => void;
  setSortDir: (d: SortDir) => void;
  setFilterOwnerId: (id: string | null) => void;
  setFilterStatus: (s: 'all' | 'active' | 'inactive') => void;
  setFilterIndustry: (i: string | null) => void;
  setFilterSegment: (s: string | null) => void;
  setFilterCountry: (c: string | null) => void;
  setFilterCity: (p: string | null) => void;
  toggleNoRecentActivityFilter: () => void;
  toggleFavoritesFilter: () => void;
  setFilterHealthTier: (t: HealthTier | null) => void;
  setPage: (page: number) => void;
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
      favoriteIds: new Set<string>(),
      searchQuery: '',
      sortBy: useSettingsStore.getState().defaultCustomerSort,
      sortDir: 'desc',
      filterOwnerId: null,
      filterStatus: 'all',
      filterIndustry: null,
      filterSegment: null,
      filterCountry: null,
      filterCity: null,
      filterNoRecentActivity: false,
      filterFavorites: false,
      filterHealthTier: null,
      page: 1,
      isLoading: false,

      setCustomers: (customers) => set({ customers }),
      setAllContacts: (allContacts) => set({ allContacts }),
      setSelectedCustomerId: (id) => set({ selectedCustomerId: id }),
      setFavoriteIds: (favoriteIds) => set({ favoriteIds }),
      toggleFavorite: (id) => {
        const { favoriteIds } = get();
        const next = new Set(favoriteIds);
        if (next.has(id)) {
          next.delete(id);
          removeCustomerFavorite(id).catch((err) =>
            console.error('[customer] Failed to remove favorite:', err)
          );
        } else {
          next.add(id);
          addCustomerFavorite(id).catch((err) =>
            console.error('[customer] Failed to add favorite:', err)
          );
        }
        set({ favoriteIds: next });
      },
      setSearchQuery: (searchQuery) => set({ searchQuery, page: 1 }),
      setSortBy: (sortBy) => set({ sortBy, page: 1 }),
      setSortDir: (sortDir) => set({ sortDir, page: 1 }),
      setFilterOwnerId: (filterOwnerId) => set({ filterOwnerId, page: 1 }),
      setFilterStatus: (filterStatus) => set({ filterStatus, page: 1 }),
      setFilterIndustry: (filterIndustry) => set({ filterIndustry, page: 1 }),
      setFilterSegment: (filterSegment) => set({ filterSegment, page: 1 }),
      setFilterCountry: (filterCountry) => set({ filterCountry, filterCity: null, page: 1 }),
      setFilterCity: (filterCity) => set({ filterCity, page: 1 }),
      toggleNoRecentActivityFilter: () =>
        set((s) => ({ filterNoRecentActivity: !s.filterNoRecentActivity, page: 1 })),
      toggleFavoritesFilter: () =>
        set((s) => ({ filterFavorites: !s.filterFavorites, page: 1 })),
      setFilterHealthTier: (filterHealthTier) => set({ filterHealthTier, page: 1 }),
      setPage: (page) => set({ page }),
      setLoading: (isLoading) => set({ isLoading }),

      clearFilters: () => set({
        sortBy: useSettingsStore.getState().defaultCustomerSort,
        filterOwnerId: null,
        filterStatus: 'all',
        filterIndustry: null,
        filterSegment: null,
        filterCountry: null,
        filterCity: null,
        filterNoRecentActivity: false,
        filterFavorites: false,
        filterHealthTier: null,
        page: 1,
      }),

      getActiveFilterCount: () => {
        const { filterOwnerId, filterStatus, filterIndustry, filterSegment, filterCountry, filterCity, filterNoRecentActivity, filterFavorites, filterHealthTier } = get();
        return [filterOwnerId, filterStatus !== 'all', filterIndustry, filterSegment, filterCountry, filterCity, filterNoRecentActivity, filterFavorites, filterHealthTier]
          .filter(Boolean).length;
      },

      getFilteredCustomers: () => {
        const {
          customers, searchQuery, sortBy, sortDir, favoriteIds,
          filterOwnerId, filterStatus, filterIndustry, filterSegment, filterCountry, filterCity, filterNoRecentActivity, filterFavorites, filterHealthTier,
        } = get();

        let result = customers;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          result = result.filter((c) =>
            c.name.toLowerCase().includes(q) ||
            c.accountNumber?.toLowerCase().includes(q) ||
            c.addressCity?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.industry?.toLowerCase().includes(q)
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
        if (filterCity) {
          result = result.filter((c) => normalizeCity(c.addressCity) === filterCity);
        }
        if (filterNoRecentActivity) {
          const thresholdDays = useSettingsStore.getState().noRecentActivityDays;
          const cutoff = new Date(Date.now() - thresholdDays * 86400000).toISOString();
          result = result.filter((c) => !c.lastActivityAt || c.lastActivityAt < cutoff);
        }
        if (filterFavorites) {
          result = result.filter((c) => favoriteIds.has(c.id));
        }
        if (filterHealthTier) {
          result = result.filter((c) => healthTier(c.healthScore) === filterHealthTier);
        }

        result = [...result].sort((a, b) => {
          let cmp = 0;
          if (sortBy === 'name') {
            cmp = a.name.localeCompare(b.name);
          } else if (sortBy === 'city') {
            cmp = (a.addressCity ?? '').localeCompare(b.addressCity ?? '');
          } else if (sortBy === 'industry') {
            cmp = (a.industry ?? '').localeCompare(b.industry ?? '');
          } else if (sortBy === 'health') {
            // null treated as lowest score
            cmp = (a.healthScore ?? -1) - (b.healthScore ?? -1);
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
        sortDir: state.sortDir,
        filterOwnerId: state.filterOwnerId,
        filterStatus: state.filterStatus,
        filterIndustry: state.filterIndustry,
        filterSegment: state.filterSegment,
        filterCountry: state.filterCountry,
        filterCity: state.filterCity,
        filterNoRecentActivity: state.filterNoRecentActivity,
        filterFavorites: state.filterFavorites,
        filterHealthTier: state.filterHealthTier,
      }),
    }
  )
);

// Sync sortBy in real-time when the default customer sort setting changes
useSettingsStore.subscribe((state, prev) => {
  if (state.defaultCustomerSort !== prev.defaultCustomerSort) {
    useCustomerStore.setState({ sortBy: state.defaultCustomerSort, page: 1 });
  }
});
