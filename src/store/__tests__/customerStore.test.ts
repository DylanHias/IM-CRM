import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCustomerStore } from '../customerStore';
import { useSettingsStore } from '../settingsStore';
import { createCustomer, createContact } from '@/__tests__/mocks/factories';

describe('customerStore', () => {
  beforeEach(() => {
    useCustomerStore.setState({
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
    });
  });

  const store = () => useCustomerStore.getState();

  // --- Basic setters ---
  describe('setters', () => {
    it('setCustomers', () => {
      const customers = [createCustomer()];
      store().setCustomers(customers);
      expect(store().customers).toEqual(customers);
    });

    it('setAllContacts', () => {
      const contacts = [createContact()];
      store().setAllContacts(contacts);
      expect(store().allContacts).toEqual(contacts);
    });

    it('setSelectedCustomerId', () => {
      store().setSelectedCustomerId('abc');
      expect(store().selectedCustomerId).toBe('abc');
    });

    it('setSearchQuery', () => {
      store().setSearchQuery('acme');
      expect(store().searchQuery).toBe('acme');
    });

    it('setSortBy', () => {
      store().setSortBy('name');
      expect(store().sortBy).toBe('name');
    });

    it('setSortDir', () => {
      store().setSortDir('asc');
      expect(store().sortDir).toBe('asc');
    });

    it('setFilterOwnerId', () => {
      store().setFilterOwnerId('owner-1');
      expect(store().filterOwnerId).toBe('owner-1');
    });

    it('setFilterStatus', () => {
      store().setFilterStatus('active');
      expect(store().filterStatus).toBe('active');
    });

    it('setFilterIndustry', () => {
      store().setFilterIndustry('Tech');
      expect(store().filterIndustry).toBe('Tech');
    });

    it('setFilterSegment', () => {
      store().setFilterSegment('Enterprise');
      expect(store().filterSegment).toBe('Enterprise');
    });

    it('setFilterCountry', () => {
      store().setFilterCountry('Belgium');
      expect(store().filterCountry).toBe('Belgium');
    });

    it('toggleNoRecentActivityFilter', () => {
      expect(store().filterNoRecentActivity).toBe(false);
      store().toggleNoRecentActivityFilter();
      expect(store().filterNoRecentActivity).toBe(true);
      store().toggleNoRecentActivityFilter();
      expect(store().filterNoRecentActivity).toBe(false);
    });

    it('setLoading', () => {
      store().setLoading(true);
      expect(store().isLoading).toBe(true);
    });
  });

  // --- Search ---
  describe('getFilteredCustomers — search', () => {
    const c1 = createCustomer({ id: '1', name: 'Acme Corp', accountNumber: 'ACC-001', addressCity: 'Antwerp', email: 'info@acme.com', industry: 'Technology' });
    const c2 = createCustomer({ id: '2', name: 'Beta Inc', accountNumber: 'ACC-002', addressCity: 'Brussels', email: 'info@beta.com', industry: 'Finance' });
    const c3 = createCustomer({ id: '3', name: 'Gamma Ltd', accountNumber: 'ACC-003', addressCity: 'Ghent', email: null, industry: null });

    beforeEach(() => {
      store().setCustomers([c1, c2, c3]);
    });

    it('returns all with empty query', () => {
      expect(store().getFilteredCustomers()).toHaveLength(3);
    });

    it('searches by customer name (case-insensitive)', () => {
      store().setSearchQuery('acme');
      expect(store().getFilteredCustomers().map((c) => c.id)).toEqual(['1']);
    });

    it('searches by account number', () => {
      store().setSearchQuery('ACC-002');
      expect(store().getFilteredCustomers().map((c) => c.id)).toEqual(['2']);
    });

    it('searches by city', () => {
      store().setSearchQuery('brussels');
      expect(store().getFilteredCustomers().map((c) => c.id)).toEqual(['2']);
    });

    it('searches by email', () => {
      store().setSearchQuery('beta.com');
      expect(store().getFilteredCustomers().map((c) => c.id)).toEqual(['2']);
    });

    it('searches by industry', () => {
      store().setSearchQuery('finance');
      expect(store().getFilteredCustomers().map((c) => c.id)).toEqual(['2']);
    });

    it('does not search by contact fields', () => {
      const contact = createContact({ customerId: '3', firstName: 'Alice', lastName: 'Wonder' });
      store().setAllContacts([contact]);
      store().setSearchQuery('alice');
      expect(store().getFilteredCustomers()).toHaveLength(0);
    });

    it('returns empty for no matches', () => {
      store().setSearchQuery('zzzznonexistent');
      expect(store().getFilteredCustomers()).toHaveLength(0);
    });
  });

  // --- Filters ---
  describe('getFilteredCustomers — filters', () => {
    const c1 = createCustomer({ id: '1', status: 'active', ownerId: 'owner-A', industry: 'Tech', segment: 'SMB', addressCountry: 'Belgium', lastActivityAt: '2026-03-20T00:00:00.000Z' });
    const c2 = createCustomer({ id: '2', status: 'inactive', ownerId: 'owner-B', industry: 'Finance', segment: 'Enterprise', addressCountry: 'Netherlands', lastActivityAt: null });
    const c3 = createCustomer({ id: '3', status: 'active', ownerId: 'owner-A', industry: 'Tech', segment: 'Enterprise', addressCountry: 'Belgium', lastActivityAt: '2025-01-01T00:00:00.000Z' });

    beforeEach(() => {
      store().setCustomers([c1, c2, c3]);
    });

    it('filters by status active', () => {
      store().setFilterStatus('active');
      expect(store().getFilteredCustomers().map((c) => c.id)).toEqual(expect.arrayContaining(['1', '3']));
      expect(store().getFilteredCustomers()).toHaveLength(2);
    });

    it('filters by status inactive', () => {
      store().setFilterStatus('inactive');
      expect(store().getFilteredCustomers().map((c) => c.id)).toEqual(['2']);
    });

    it('status all returns everything', () => {
      store().setFilterStatus('all');
      expect(store().getFilteredCustomers()).toHaveLength(3);
    });

    it('filters by owner', () => {
      store().setFilterOwnerId('owner-A');
      expect(store().getFilteredCustomers()).toHaveLength(2);
    });

    it('filters by industry', () => {
      store().setFilterIndustry('Finance');
      expect(store().getFilteredCustomers()).toHaveLength(1);
    });

    it('filters by segment', () => {
      store().setFilterSegment('Enterprise');
      expect(store().getFilteredCustomers()).toHaveLength(2);
    });

    it('filters by country', () => {
      store().setFilterCountry('Belgium');
      expect(store().getFilteredCustomers()).toHaveLength(2);
    });

    it('combines multiple filters (AND logic)', () => {
      store().setFilterStatus('active');
      store().setFilterCountry('Belgium');
      store().setFilterIndustry('Tech');
      const result = store().getFilteredCustomers();
      expect(result).toHaveLength(2);
    });

    it('no-recent-activity filter uses settings threshold', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-25T12:00:00.000Z'));
      useSettingsStore.setState({ noRecentActivityDays: 90 });
      store().toggleNoRecentActivityFilter();
      const result = store().getFilteredCustomers();
      // c2 (null) and c3 (Jan 2025) should match
      expect(result.map((c) => c.id)).toEqual(expect.arrayContaining(['2', '3']));
      vi.useRealTimers();
    });
  });

  // --- Sorting ---
  describe('getFilteredCustomers — sorting', () => {
    const c1 = createCustomer({ id: '1', name: 'Charlie', addressCity: 'Brussels', industry: 'Zinc', lastActivityAt: '2026-03-01T00:00:00.000Z' });
    const c2 = createCustomer({ id: '2', name: 'Alice', addressCity: 'Antwerp', industry: 'Alpha', lastActivityAt: null });
    const c3 = createCustomer({ id: '3', name: 'Bob', addressCity: 'Ghent', industry: 'Metal', lastActivityAt: '2026-03-20T00:00:00.000Z' });

    beforeEach(() => {
      store().setCustomers([c1, c2, c3]);
    });

    it('sorts by name asc', () => {
      store().setSortBy('name');
      store().setSortDir('asc');
      expect(store().getFilteredCustomers().map((c) => c.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('sorts by name desc', () => {
      store().setSortBy('name');
      store().setSortDir('desc');
      expect(store().getFilteredCustomers().map((c) => c.name)).toEqual(['Charlie', 'Bob', 'Alice']);
    });

    it('sorts by city asc', () => {
      store().setSortBy('city');
      store().setSortDir('asc');
      expect(store().getFilteredCustomers().map((c) => c.addressCity)).toEqual(['Antwerp', 'Brussels', 'Ghent']);
    });

    it('sorts by industry asc', () => {
      store().setSortBy('industry');
      store().setSortDir('asc');
      expect(store().getFilteredCustomers().map((c) => c.industry)).toEqual(['Alpha', 'Metal', 'Zinc']);
    });

    it('sorts by lastActivity desc with null as oldest', () => {
      store().setSortBy('lastActivity');
      store().setSortDir('desc');
      const result = store().getFilteredCustomers();
      expect(result[0].id).toBe('3'); // most recent
      expect(result[result.length - 1].id).toBe('2'); // null = oldest
    });
  });

  // --- Other getters ---
  describe('clearFilters', () => {
    it('resets all filter fields', () => {
      store().setFilterOwnerId('owner-1');
      store().setFilterStatus('active');
      store().setFilterIndustry('Tech');
      store().setFilterSegment('SMB');
      store().setFilterCountry('Belgium');
      store().toggleNoRecentActivityFilter();

      store().clearFilters();

      expect(store().filterOwnerId).toBeNull();
      expect(store().filterStatus).toBe('all');
      expect(store().filterIndustry).toBeNull();
      expect(store().filterSegment).toBeNull();
      expect(store().filterCountry).toBeNull();
      expect(store().filterNoRecentActivity).toBe(false);
    });
  });

  describe('getActiveFilterCount', () => {
    it('returns 0 with no active filters', () => {
      expect(store().getActiveFilterCount()).toBe(0);
    });

    it('counts each active filter', () => {
      store().setFilterOwnerId('owner-1');
      store().setFilterStatus('active');
      store().setFilterIndustry('Tech');
      expect(store().getActiveFilterCount()).toBe(3);
    });
  });

  describe('real-time settings sync', () => {
    it('changing defaultCustomerSort in settings updates sortBy in customerStore', () => {
      // Initial: sortBy comes from settings default ('lastActivity')
      useSettingsStore.getState().resetAll();
      expect(store().sortBy).toBe('lastActivity');

      // Change the setting
      useSettingsStore.getState().updateSetting('defaultCustomerSort', 'name');

      // customerStore should update in real-time via subscription
      expect(store().sortBy).toBe('name');
    });

    it('changing defaultCustomerSort resets page to 1', () => {
      useSettingsStore.getState().resetAll();
      store().setPage(3);
      expect(store().page).toBe(3);

      useSettingsStore.getState().updateSetting('defaultCustomerSort', 'city');
      expect(store().page).toBe(1);
    });
  });

  describe('getSelectedCustomer', () => {
    it('returns customer when found', () => {
      const c = createCustomer({ id: 'abc' });
      store().setCustomers([c]);
      store().setSelectedCustomerId('abc');
      expect(store().getSelectedCustomer()?.id).toBe('abc');
    });

    it('returns null when not found', () => {
      store().setSelectedCustomerId('nonexistent');
      expect(store().getSelectedCustomer()).toBeNull();
    });

    it('returns null when id is null', () => {
      store().setSelectedCustomerId(null);
      expect(store().getSelectedCustomer()).toBeNull();
    });
  });
});
