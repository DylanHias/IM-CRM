import { create } from 'zustand';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import type {
  CrmUser,
  UserRole,
  SyncHealthMetrics,
  TableStats,
  AnalyticsRange,
  AnalyticsRangeKey,
  LeaderboardRow,
  UserDrilldown,
  ZeroActivityUser,
  OverdueFollowupSummary,
} from '@/types/admin';
import type { SyncRecord } from '@/types/sync';

interface AdminState {
  users: CrmUser[];
  syncHealth: SyncHealthMetrics | null;
  syncErrors: SyncRecord[];
  tableStats: TableStats[];
  isLoading: boolean;

  // Team Analytics
  leaderboard: LeaderboardRow[];
  zeroActivityUsers: ZeroActivityUser[];
  overdueByUser: OverdueFollowupSummary[];
  drilldowns: Record<string, UserDrilldown>;
  analyticsRange: AnalyticsRange | null;
  isLoadingAnalytics: boolean;
  isRefreshingFromD365: boolean;
  drilldownLoading: Record<string, boolean>;

  setUsers: (users: CrmUser[]) => void;
  setSyncHealth: (health: SyncHealthMetrics) => void;
  setSyncErrors: (errors: SyncRecord[]) => void;
  setTableStats: (data: TableStats[]) => void;
  setLoading: (loading: boolean) => void;

  loadUsers: () => Promise<void>;
  refreshUsersFromD365: (token: string) => Promise<void>;
  loadSyncAdmin: () => Promise<void>;
  loadTeamAnalytics: (rangeKey: AnalyticsRangeKey) => Promise<void>;
  loadUserDrilldown: (userId: string, rangeKey?: AnalyticsRangeKey) => Promise<void>;
  refreshAnalyticsFromD365: (token: string, rangeKey: AnalyticsRangeKey) => Promise<void>;
  loadDataManagement: () => Promise<void>;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
  setUserAnalyticsTracked: (id: string, tracked: boolean) => Promise<void>;
  bulkSetAnalyticsTracked: (ids: string[], tracked: boolean) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  syncHealth: null,
  syncErrors: [],
  tableStats: [],
  isLoading: false,

  leaderboard: [],
  zeroActivityUsers: [],
  overdueByUser: [],
  drilldowns: {},
  analyticsRange: null,
  isLoadingAnalytics: false,
  isRefreshingFromD365: false,
  drilldownLoading: {},

  setUsers: (users) => set({ users }),
  setSyncHealth: (syncHealth) => set({ syncHealth }),
  setSyncErrors: (syncErrors) => set({ syncErrors }),
  setTableStats: (tableStats) => set({ tableStats }),
  setLoading: (isLoading) => set({ isLoading }),

  loadUsers: async () => {
    set({ isLoading: true });
    try {
      const { queryAllUsers } = await import('@/lib/db/queries/users');
      const users = await queryAllUsers();
      set({ users });
    } catch (e) {
      console.error('[admin] loadUsers failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  refreshUsersFromD365: async (token: string) => {
    if (!isTauriApp()) return;
    set({ isLoading: true });
    try {
      const { fetchD365Users } = await import('@/lib/sync/d365UserAdapter');
      const { bulkUpsertUsers, queryAllUsers } = await import('@/lib/db/queries/users');
      const d365Users = await fetchD365Users(token);
      await bulkUpsertUsers(d365Users);
      const users = await queryAllUsers();
      set({ users });
    } catch (e) {
      console.error('[admin] refreshUsersFromD365 failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  loadSyncAdmin: async () => {
    set({ isLoading: true });
    try {
      const { querySyncHealthMetrics, querySyncErrors } = await import('@/lib/db/queries/adminAnalytics');
      const [health, errors] = await Promise.all([
        querySyncHealthMetrics().catch((e) => { console.error('[admin] syncHealth query failed:', e); return null; }),
        querySyncErrors().catch((e) => { console.error('[admin] syncErrors query failed:', e); return [] as SyncRecord[]; }),
      ]);
      set({ syncHealth: health, syncErrors: errors });
    } catch (e) {
      console.error('[admin] loadSyncAdmin failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  loadTeamAnalytics: async (rangeKey: AnalyticsRangeKey) => {
    set({ isLoadingAnalytics: true });
    try {
      const { buildRange, queryTeamLeaderboard, queryZeroActivityUsers, queryOverdueFollowupsByUser } =
        await import('@/lib/db/queries/teamAnalytics');
      const range = buildRange(rangeKey);
      const [leaderboard, zeroActivityUsers, overdueByUser] = await Promise.all([
        queryTeamLeaderboard(range).catch((e) => { console.error('[admin] leaderboard query failed:', e); return []; }),
        queryZeroActivityUsers(range).catch((e) => { console.error('[admin] zeroActivity query failed:', e); return []; }),
        queryOverdueFollowupsByUser().catch((e) => { console.error('[admin] overdue query failed:', e); return []; }),
      ]);
      // Reset drilldowns whenever the range changes so we don't show stale data.
      set({
        leaderboard,
        zeroActivityUsers,
        overdueByUser,
        analyticsRange: range,
        drilldowns: {},
      });
    } catch (e) {
      console.error('[admin] loadTeamAnalytics failed:', e);
    } finally {
      set({ isLoadingAnalytics: false });
    }
  },

  loadUserDrilldown: async (userId: string, rangeKey?: AnalyticsRangeKey) => {
    const { analyticsRange, drilldownLoading } = get();
    if (drilldownLoading[userId]) return;
    set({ drilldownLoading: { ...drilldownLoading, [userId]: true } });
    try {
      const { buildRange, queryUserDrilldown } = await import('@/lib/db/queries/teamAnalytics');
      const range = rangeKey ? buildRange(rangeKey) : (analyticsRange ?? buildRange('30d'));
      const drilldown = await queryUserDrilldown(userId, range);
      set((s) => ({ drilldowns: { ...s.drilldowns, [userId]: drilldown } }));
    } catch (e) {
      console.error('[admin] loadUserDrilldown failed:', e);
    } finally {
      set((s) => {
        const next = { ...s.drilldownLoading };
        delete next[userId];
        return { drilldownLoading: next };
      });
    }
  },

  refreshAnalyticsFromD365: async (token: string, rangeKey: AnalyticsRangeKey) => {
    if (!isTauriApp()) return;
    set({ isRefreshingFromD365: true });
    try {
      const { runFullSync } = await import('@/lib/sync/syncService');
      const { fetchD365Users } = await import('@/lib/sync/d365UserAdapter');
      const { bulkUpsertUsers, queryAllUsers } = await import('@/lib/db/queries/users');

      // 1. Refresh user roster from D365 (keeps analytics_tracked intact)
      try {
        const d365Users = await fetchD365Users(token);
        await bulkUpsertUsers(d365Users);
      } catch (e) {
        console.error('[admin] refresh: user fetch failed:', e);
      }

      // 2. Pull latest activities, opps, follow-ups, customers, contacts
      try {
        await runFullSync(token);
      } catch (e) {
        console.error('[admin] refresh: full sync failed:', e);
      }

      // 3. Reload users + analytics from the freshly synced DB
      const users = await queryAllUsers();
      set({ users });
      await get().loadTeamAnalytics(rangeKey);
    } catch (e) {
      console.error('[admin] refreshAnalyticsFromD365 failed:', e);
    } finally {
      set({ isRefreshingFromD365: false });
    }
  },

  loadDataManagement: async () => {
    set({ isLoading: true });
    try {
      const { queryTableStats } = await import('@/lib/db/queries/adminAnalytics');
      const tableStats = await queryTableStats();
      set({ tableStats });
    } catch (e) {
      console.error('[admin] loadDataManagement failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  updateUserRole: async (id: string, role: UserRole) => {
    if (isTauriApp()) {
      const { updateUserRole } = await import('@/lib/db/queries/users');
      await updateUserRole(id, role);
    }
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, role } : u)),
    }));
  },

  setUserAnalyticsTracked: async (id: string, tracked: boolean) => {
    // Optimistic update
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, analyticsTracked: tracked } : u)),
    }));
    if (!isTauriApp()) return;
    try {
      const { setUserAnalyticsTracked } = await import('@/lib/db/queries/users');
      await setUserAnalyticsTracked(id, tracked);
    } catch (e) {
      console.error('[admin] setUserAnalyticsTracked failed:', e);
      // Roll back on failure
      set((s) => ({
        users: s.users.map((u) => (u.id === id ? { ...u, analyticsTracked: !tracked } : u)),
      }));
    }
  },

  bulkSetAnalyticsTracked: async (ids: string[], tracked: boolean) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    // Snapshot for rollback
    const prev = get().users;
    set({
      users: prev.map((u) => (idSet.has(u.id) ? { ...u, analyticsTracked: tracked } : u)),
    });
    if (!isTauriApp()) return;
    try {
      const { bulkSetAnalyticsTracked } = await import('@/lib/db/queries/users');
      await bulkSetAnalyticsTracked(ids, tracked);
    } catch (e) {
      console.error('[admin] bulkSetAnalyticsTracked failed:', e);
      set({ users: prev });
    }
  },
}));
