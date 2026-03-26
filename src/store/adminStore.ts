import { create } from 'zustand';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import type {
  CrmUser,
  UserRole,
  AuditLogEntry,
  AuditLogFilters,
  SyncHealthMetrics,
  DataQualityMetrics,
  ActivityTimelinePoint,
  PipelineStats,
  TableStats,
} from '@/types/admin';
import type { SyncRecord } from '@/types/sync';

interface AdminState {
  users: CrmUser[];
  auditEntries: AuditLogEntry[];
  auditTotalCount: number;
  auditFilters: AuditLogFilters;
  syncHealth: SyncHealthMetrics | null;
  syncErrors: SyncRecord[];
  dataQuality: DataQualityMetrics | null;
  activityTimeline: ActivityTimelinePoint[];
  activityByUser: { userName: string; count: number }[];
  pipelineByStage: PipelineStats[];
  winRate: { won: number; lost: number; open: number } | null;
  tableStats: TableStats[];
  isLoading: boolean;

  setUsers: (users: CrmUser[]) => void;
  setAuditEntries: (entries: AuditLogEntry[], totalCount: number) => void;
  setAuditFilters: (filters: Partial<AuditLogFilters>) => void;
  setSyncHealth: (health: SyncHealthMetrics) => void;
  setSyncErrors: (errors: SyncRecord[]) => void;
  setDataQuality: (quality: DataQualityMetrics) => void;
  setActivityTimeline: (data: ActivityTimelinePoint[]) => void;
  setActivityByUser: (data: { userName: string; count: number }[]) => void;
  setPipelineByStage: (data: PipelineStats[]) => void;
  setWinRate: (data: { won: number; lost: number; open: number }) => void;
  setTableStats: (data: TableStats[]) => void;
  setLoading: (loading: boolean) => void;

  loadUsers: () => Promise<void>;
  refreshUsersFromD365: (token: string) => Promise<void>;
  loadAuditLog: () => Promise<void>;
  loadSyncAdmin: () => Promise<void>;
  loadAnalytics: () => Promise<void>;
  loadDataManagement: () => Promise<void>;
  updateUserRole: (id: string, role: UserRole) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
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

  setUsers: (users) => set({ users }),
  setAuditEntries: (auditEntries, auditTotalCount) => set({ auditEntries, auditTotalCount }),
  setAuditFilters: (filters) => set((s) => ({ auditFilters: { ...s.auditFilters, ...filters } })),
  setSyncHealth: (syncHealth) => set({ syncHealth }),
  setSyncErrors: (syncErrors) => set({ syncErrors }),
  setDataQuality: (dataQuality) => set({ dataQuality }),
  setActivityTimeline: (activityTimeline) => set({ activityTimeline }),
  setActivityByUser: (activityByUser) => set({ activityByUser }),
  setPipelineByStage: (pipelineByStage) => set({ pipelineByStage }),
  setWinRate: (winRate) => set({ winRate }),
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
    } finally {
      set({ isLoading: false });
    }
  },

  loadAuditLog: async () => {
    set({ isLoading: true });
    try {
      const { queryAuditLog, queryAuditLogCount } = await import('@/lib/db/queries/auditLog');
      const filters = get().auditFilters;
      const [entries, totalCount] = await Promise.all([
        queryAuditLog(filters),
        queryAuditLogCount(filters),
      ]);
      set({ auditEntries: entries, auditTotalCount: totalCount });
    } catch (e) {
      console.error('[admin] loadAuditLog failed:', e);
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

  loadAnalytics: async () => {
    set({ isLoading: true });
    try {
      const {
        queryDataQualityMetrics,
        queryActivityTimeline,
        queryActivityBreakdownByUser,
        queryPipelineByStage,
        queryWinRate,
      } = await import('@/lib/db/queries/adminAnalytics');

      const [dataQuality, activityTimeline, activityByUser, pipelineByStage, winRate] =
        await Promise.all([
          queryDataQualityMetrics().catch((e) => { console.error('[admin] dataQuality query failed:', e); return null; }),
          queryActivityTimeline().catch((e) => { console.error('[admin] activityTimeline query failed:', e); return [] as ActivityTimelinePoint[]; }),
          queryActivityBreakdownByUser().catch((e) => { console.error('[admin] activityByUser query failed:', e); return [] as { userName: string; count: number }[]; }),
          queryPipelineByStage().catch((e) => { console.error('[admin] pipelineByStage query failed:', e); return [] as PipelineStats[]; }),
          queryWinRate().catch((e) => { console.error('[admin] winRate query failed:', e); return null; }),
        ]);

      set({ dataQuality, activityTimeline, activityByUser, pipelineByStage, winRate });
    } catch (e) {
      console.error('[admin] loadAnalytics failed:', e);
    } finally {
      set({ isLoading: false });
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
}));
