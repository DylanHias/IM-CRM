import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAdminStore } from '../adminStore';
import { createCrmUser, createSyncRecord } from '@/__tests__/mocks/factories';

vi.mock('@/lib/db/queries/users', () => ({
  queryAllUsers: vi.fn().mockResolvedValue([
    { id: 'u1', email: 'jan@test.be', name: 'Jan De Vries', role: 'admin', businessUnit: null, lastActiveAt: null, createdAt: '', updatedAt: '' },
    { id: 'u2', email: 'sophie@test.be', name: 'Sophie Martens', role: 'user', businessUnit: null, lastActiveAt: null, createdAt: '', updatedAt: '' },
  ]),
}));

vi.mock('@/lib/db/queries/adminAnalytics', () => ({
  queryDataQualityMetrics: vi.fn().mockResolvedValue({ totalCustomers: 10, customersWithoutContacts: 2, customersWithoutRecentActivity: 3, staleOpportunities: 1 }),
  queryActivityTimeline: vi.fn().mockResolvedValue([{ date: '2026-03-01', meeting: 1, call: 2, visit: 0, note: 1 }]),
  queryActivityBreakdownByUser: vi.fn().mockResolvedValue([{ userName: 'Jan De Vries', count: 5, meeting: 2, call: 1, visit: 1, note: 1 }]),
  queryPipelineByStage: vi.fn().mockResolvedValue([{ stage: 'Discovery', count: 3, totalRevenue: 90000 }]),
  queryWinRate: vi.fn().mockResolvedValue({ won: 3, lost: 1, open: 5 }),
  querySyncHealthMetrics: vi.fn().mockResolvedValue(null),
  querySyncErrors: vi.fn().mockResolvedValue([]),
  queryTableStats: vi.fn().mockResolvedValue([]),
}));

describe('adminStore', () => {
  beforeEach(() => {
    useAdminStore.setState({
      users: [],
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
    const data = [{ userName: 'Dylan', count: 15, meeting: 5, call: 4, visit: 3, note: 3 }];
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

  it('loadUsers queries DB and populates state', async () => {
    await store().loadUsers();
    expect(store().users.length).toBeGreaterThan(0);
    expect(store().isLoading).toBe(false);
  });

  it('loadAnalytics queries DB and populates state', async () => {
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
