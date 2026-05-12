import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAdminStore } from '../adminStore';
import { createCrmUser, createSyncRecord } from '@/__tests__/mocks/factories';

vi.mock('@/lib/db/queries/users', () => ({
  queryAllUsers: vi.fn().mockResolvedValue([
    createCrmUser({ id: 'u1', name: 'Jan De Vries', role: 'admin' }),
    createCrmUser({ id: 'u2', name: 'Sophie Martens', role: 'user', analyticsTracked: true }),
  ]),
  setUserAnalyticsTracked: vi.fn().mockResolvedValue(undefined),
  bulkSetAnalyticsTracked: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/db/queries/adminAnalytics', () => ({
  querySyncHealthMetrics: vi.fn().mockResolvedValue({
    totalSyncs: 1, successCount: 1, errorCount: 0, successRate: 100, avgDurationMs: 200, totalRecordsProcessed: 10,
  }),
  querySyncErrors: vi.fn().mockResolvedValue([]),
  queryTableStats: vi.fn().mockResolvedValue([{ tableName: 'customers', rowCount: 5 }]),
}));

vi.mock('@/lib/db/queries/teamAnalytics', () => ({
  buildRange: vi.fn(() => ({ start: '2026-04-12T00:00:00.000Z', end: '2026-05-12T00:00:00.000Z', key: '30d' })),
  queryTeamLeaderboard: vi.fn().mockResolvedValue([{
    userId: 'u1', userName: 'Jan De Vries', email: 'jan@test.be', title: null, profilePhoto: null,
    activityTotal: 5, meetings: 2, calls: 1, visits: 1, notes: 1,
    followupsCreated: 3, followupsCompleted: 2, followupCompletionPct: 67,
    oppsCreated: 1, oppsCreatedValue: 10000, oppsWon: 0, oppsWonValue: 0, oppsLost: 0, winRatePct: null,
    customersTouched: 4,
  }]),
  queryZeroActivityUsers: vi.fn().mockResolvedValue([]),
  queryOverdueFollowupsByUser: vi.fn().mockResolvedValue([]),
  queryUserDrilldown: vi.fn().mockResolvedValue({
    userId: 'u1', timeline: [], recentActivities: [], openOpps: [], openOppsValue: 0,
    staleCustomers: [], overdueFollowups: [],
  }),
}));

describe('adminStore', () => {
  beforeEach(() => {
    useAdminStore.setState({
      users: [],
      syncHealth: null,
      syncErrors: [],
      tableStats: [],
      leaderboard: [],
      zeroActivityUsers: [],
      overdueByUser: [],
      drilldowns: {},
      analyticsRange: null,
      drilldownLoading: {},
      isLoading: false,
      isLoadingAnalytics: false,
      isRefreshingFromD365: false,
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

  it('loadTeamAnalytics populates leaderboard and range', async () => {
    await store().loadTeamAnalytics('30d');
    expect(store().leaderboard.length).toBe(1);
    expect(store().analyticsRange?.key).toBe('30d');
    expect(store().isLoadingAnalytics).toBe(false);
  });

  it('loadUserDrilldown caches drilldown by userId', async () => {
    await store().loadTeamAnalytics('30d');
    await store().loadUserDrilldown('u1');
    expect(store().drilldowns['u1']).toBeDefined();
  });

  it('updateUserRole updates role in-place', () => {
    const user = createCrmUser({ id: 'u1', role: 'user' });
    store().setUsers([user]);
    store().updateUserRole('u1', 'admin');
    expect(store().users[0].role).toBe('admin');
  });

  it('setUserAnalyticsTracked flips the flag optimistically', async () => {
    const user = createCrmUser({ id: 'u1', analyticsTracked: false });
    store().setUsers([user]);
    await store().setUserAnalyticsTracked('u1', true);
    expect(store().users[0].analyticsTracked).toBe(true);
  });

  it('bulkSetAnalyticsTracked flips multiple users at once', async () => {
    const a = createCrmUser({ id: 'u1', analyticsTracked: false });
    const b = createCrmUser({ id: 'u2', analyticsTracked: false });
    const c = createCrmUser({ id: 'u3', analyticsTracked: false });
    store().setUsers([a, b, c]);
    await store().bulkSetAnalyticsTracked(['u1', 'u3'], true);
    const users = store().users;
    expect(users.find((u) => u.id === 'u1')?.analyticsTracked).toBe(true);
    expect(users.find((u) => u.id === 'u2')?.analyticsTracked).toBe(false);
    expect(users.find((u) => u.id === 'u3')?.analyticsTracked).toBe(true);
  });
});
