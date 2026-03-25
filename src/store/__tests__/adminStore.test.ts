import { describe, it, expect, beforeEach } from 'vitest';
import { useAdminStore } from '../adminStore';
import { createCrmUser, createAuditLogEntry, createSyncRecord } from '@/__tests__/mocks/factories';

describe('adminStore', () => {
  beforeEach(() => {
    useAdminStore.setState({
      users: [],
      auditEntries: [],
      auditTotalCount: 0,
      auditFilters: { limit: 25, offset: 0 },
      syncHealth: null,
      syncErrors: [],
      dataQuality: null,
      activityTimeline: [],
      activityByUser: [],
      pipelineByStage: [],
      winRate: null,
      tableStats: [],
      isLoading: false,
    });
  });

  const store = () => useAdminStore.getState();

  it('setUsers', () => {
    const users = [createCrmUser()];
    store().setUsers(users);
    expect(store().users).toEqual(users);
  });

  it('setAuditEntries', () => {
    const entries = [createAuditLogEntry()];
    store().setAuditEntries(entries, 42);
    expect(store().auditEntries).toEqual(entries);
    expect(store().auditTotalCount).toBe(42);
  });

  it('setAuditFilters merges partial', () => {
    store().setAuditFilters({ entityType: 'activity' });
    expect(store().auditFilters.entityType).toBe('activity');
    expect(store().auditFilters.limit).toBe(25); // original preserved
  });

  it('setSyncHealth', () => {
    const health = { totalSyncs: 10, successCount: 8, errorCount: 2, successRate: 80, avgDurationMs: 500, totalRecordsProcessed: 100 };
    store().setSyncHealth(health);
    expect(store().syncHealth).toEqual(health);
  });

  it('setSyncErrors', () => {
    const errors = [createSyncRecord({ status: 'error' })];
    store().setSyncErrors(errors);
    expect(store().syncErrors).toEqual(errors);
  });

  it('setDataQuality', () => {
    const quality = { customersWithoutContacts: 5, customersWithoutRecentActivity: 10, staleOpportunities: 3, totalCustomers: 100, totalContacts: 200, totalActivities: 500 };
    store().setDataQuality(quality);
    expect(store().dataQuality).toEqual(quality);
  });

  it('setActivityTimeline', () => {
    const data = [{ date: '2026-03-01', meeting: 5, call: 3, visit: 1, note: 2 }];
    store().setActivityTimeline(data);
    expect(store().activityTimeline).toEqual(data);
  });

  it('setActivityByUser', () => {
    const data = [{ userName: 'Dylan', count: 15 }];
    store().setActivityByUser(data);
    expect(store().activityByUser).toEqual(data);
  });

  it('setPipelineByStage', () => {
    const data = [{ stage: 'Prospecting', count: 5, totalRevenue: 50000 }];
    store().setPipelineByStage(data);
    expect(store().pipelineByStage).toEqual(data);
  });

  it('setWinRate', () => {
    const data = { won: 10, lost: 5, open: 20 };
    store().setWinRate(data);
    expect(store().winRate).toEqual(data);
  });

  it('setTableStats', () => {
    const data = [{ tableName: 'customers', rowCount: 100 }];
    store().setTableStats(data);
    expect(store().tableStats).toEqual(data);
  });

  it('setLoading', () => {
    store().setLoading(true);
    expect(store().isLoading).toBe(true);
  });

  it('loadUsers loads mock data outside Tauri', async () => {
    await store().loadUsers();
    expect(store().users.length).toBeGreaterThan(0);
    expect(store().isLoading).toBe(false);
  });

  it('loadAnalytics loads mock data outside Tauri', async () => {
    await store().loadAnalytics();
    expect(store().dataQuality).not.toBeNull();
    expect(store().activityTimeline.length).toBeGreaterThan(0);
    expect(store().isLoading).toBe(false);
  });

  it('updateUserRole updates role in-place', () => {
    const user = createCrmUser({ id: 'u1', role: 'user' });
    store().setUsers([user]);
    store().updateUserRole('u1', 'admin');
    expect(store().users[0].role).toBe('admin');
  });
});
