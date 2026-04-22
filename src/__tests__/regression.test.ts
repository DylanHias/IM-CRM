import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCustomerStore } from '@/store/customerStore';
import { useFollowUpStore } from '@/store/followUpStore';
import { useActivityStore } from '@/store/activityStore';
import { useSyncStore } from '@/store/syncStore';
import { useSettingsStore } from '@/store/settingsStore';
import { formatDueDate, formatRelative, todayISO } from '@/lib/utils/dateUtils';
import {
  createCustomer,
  createFollowUp,
  createActivity,
  createSyncError,
} from '@/__tests__/mocks/factories';

const resetCustomerStore = () =>
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

const resetFollowUpStore = () =>
  useFollowUpStore.setState({
    followUps: [],
    currentCustomerId: null,
    overdueCount: 0,
    isLoading: false,
  });

const resetActivityStore = () =>
  useActivityStore.setState({
    activities: [],
    currentCustomerId: null,
    pendingCount: 0,
    isLoading: false,
  });

const resetSyncStore = () =>
  useSyncStore.setState({
    isSyncing: false,
    lastD365SyncAt: null,
    syncErrors: [],
    recentRecords: [],
    pendingActivityCount: 0,
    pendingFollowUpCount: 0,
  });

const resetSettingsStore = () => useSettingsStore.getState().resetAll();

describe('Regression tests', () => {
  beforeEach(() => {
    resetCustomerStore();
    resetFollowUpStore();
    resetActivityStore();
    resetSyncStore();
    resetSettingsStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Customer store edge cases ---
  describe('Customer store edge cases', () => {
    const store = () => useCustomerStore.getState();

    it('search with regex special chars does not throw', () => {
      store().setSearchQuery('.*+?^${}()|[]\\');
      store().setCustomers([createCustomer()]);
      expect(() => store().getFilteredCustomers()).not.toThrow();
    });

    it('search with unicode characters works', () => {
      const customer = createCustomer({ name: 'Konig Brauerei' });
      store().setCustomers([customer]);
      store().setSearchQuery('Konig');
      const results = store().getFilteredCustomers();
      expect(results).toHaveLength(1);
    });

    it('filter on empty customer list returns empty array', () => {
      store().setFilterStatus('active');
      const results = store().getFilteredCustomers();
      expect(results).toEqual([]);
    });

    it('sorting when all lastActivityAt are null does not crash', () => {
      const customers = [
        createCustomer({ name: 'A', lastActivityAt: null }),
        createCustomer({ name: 'B', lastActivityAt: null }),
        createCustomer({ name: 'C', lastActivityAt: null }),
      ];
      store().setCustomers(customers);
      store().setSortBy('lastActivity');
      store().setSortDir('desc');
      expect(() => store().getFilteredCustomers()).not.toThrow();
    });

    it('sorting with mix of null and non-null lastActivityAt — nulls at end in desc', () => {
      const withDate = createCustomer({ name: 'With', lastActivityAt: '2026-03-20T10:00:00.000Z' });
      const withNull = createCustomer({ name: 'Null', lastActivityAt: null });
      store().setCustomers([withNull, withDate]);
      store().setSortBy('lastActivity');
      store().setSortDir('desc');
      const results = store().getFilteredCustomers();
      expect(results[0].name).toBe('With');
      expect(results[1].name).toBe('Null');
    });

    it('getActiveFilterCount returns 0 when all filters default', () => {
      expect(store().getActiveFilterCount()).toBe(0);
    });

    it('combined: search + status filter + sort', () => {
      const active = createCustomer({ name: 'Alpha Active', status: 'active', addressCity: 'Antwerp' });
      const inactive = createCustomer({ name: 'Alpha Inactive', status: 'inactive', addressCity: 'Brussels' });
      const other = createCustomer({ name: 'Beta Active', status: 'active', addressCity: 'Ghent' });
      store().setCustomers([active, inactive, other]);
      store().setSearchQuery('Alpha');
      store().setFilterStatus('active');
      store().setSortBy('name');
      store().setSortDir('asc');
      const results = store().getFilteredCustomers();
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alpha Active');
    });

    it('getSelectedCustomer returns null when customers empty', () => {
      store().setSelectedCustomerId('non-existent');
      expect(store().getSelectedCustomer()).toBeNull();
    });
  });

  // --- Date utils edge cases ---
  describe('Date utils edge cases', () => {
    it('formatDueDate at midnight boundary', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-25T00:00:00.000Z'));
      const result = formatDueDate('2026-03-25');
      expect(result.label).toBe('Today');
      expect(result.isOverdue).toBe(false);
      vi.useRealTimers();
    });

    it('formatRelative with far-future date', () => {
      const result = formatRelative('2099-12-31T00:00:00.000Z');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('todayISO returns exactly 10 chars', () => {
      const today = todayISO();
      expect(today).toHaveLength(10);
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // --- Follow-up store edge cases ---
  describe('Follow-up store edge cases', () => {
    const store = () => useFollowUpStore.getState();

    it('markComplete on already-completed follow-up — completed stays true', () => {
      const followUp = createFollowUp({
        id: 'fu-1',
        completed: true,
        completedAt: '2026-03-20T10:00:00.000Z',
        dueDate: '2026-04-01',
      });
      store().setFollowUps([followUp], 'cust-1');
      store().markComplete('fu-1');
      const updated = store().followUps.find((f) => f.id === 'fu-1');
      expect(updated?.completed).toBe(true);
    });

    it('markComplete with overdueCount=0 stays at 0', () => {
      const followUp = createFollowUp({
        id: 'fu-2',
        completed: false,
        dueDate: '2099-12-31',
      });
      store().setFollowUps([followUp], 'cust-1');
      useFollowUpStore.setState({ overdueCount: 0 });
      store().markComplete('fu-2');
      expect(store().overdueCount).toBe(0);
    });

    it('removeFollowUp with non-existent id — no error, length unchanged', () => {
      const followUp = createFollowUp({ id: 'fu-3' });
      store().setFollowUps([followUp], 'cust-1');
      expect(() => store().removeFollowUp('non-existent')).not.toThrow();
      expect(store().followUps).toHaveLength(1);
    });
  });

  // --- Sync store edge cases ---
  describe('Sync store edge cases', () => {
    const store = () => useSyncStore.getState();

    it('addSyncError 51 times — array length stays at 50', () => {
      for (let i = 0; i < 51; i++) {
        store().addSyncError(createSyncError({ message: `Error ${i}` }));
      }
      expect(store().syncErrors).toHaveLength(50);
    });
  });

  // --- Settings store edge cases ---
  describe('Settings store edge cases', () => {
    const store = () => useSettingsStore.getState();

    it('resetSection does not affect other sections', () => {
      store().updateSetting('theme', 'dark');
      store().updateSetting('defaultActivityType', 'call');
      store().resetSection('appearance');
      expect(store().theme).toBe('light');
      expect(store().defaultActivityType).toBe('call');
    });

    it('updateSetting with same value — idempotent', () => {
      const before = store().theme;
      store().updateSetting('theme', before);
      expect(store().theme).toBe(before);
    });
  });

  // --- Activity store edge cases ---
  describe('Activity store edge cases', () => {
    const store = () => useActivityStore.getState();

    it('addActivity with syncStatus=synced — pendingCount stays 0', () => {
      const activity = createActivity({ syncStatus: 'synced' });
      store().addActivity(activity);
      expect(store().pendingCount).toBe(0);
    });

    it('updateActivity with non-existent id — no crash, activities unchanged', () => {
      const existing = createActivity({ id: 'act-1' });
      store().setActivities([existing], 'cust-1');
      const ghost = createActivity({ id: 'non-existent', subject: 'Ghost' });
      expect(() => store().updateActivity(ghost)).not.toThrow();
      expect(store().activities).toHaveLength(1);
      expect(store().activities[0].id).toBe('act-1');
    });
  });
});
