import { create } from 'zustand';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import type {
  CrmUser,
  UserRole,
  AuditLogEntry,
  AuditLogFilters,
  SyncHealthMetrics,
  DataQualityMetrics,
  ActivityBreakdown,
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
  activityByType: ActivityBreakdown[];
  activityByMonth: { month: string; count: number }[];
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
  setActivityByType: (data: ActivityBreakdown[]) => void;
  setActivityByMonth: (data: { month: string; count: number }[]) => void;
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
  activityByType: [],
  activityByMonth: [],
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
  setActivityByType: (activityByType) => set({ activityByType }),
  setActivityByMonth: (activityByMonth) => set({ activityByMonth }),
  setActivityByUser: (activityByUser) => set({ activityByUser }),
  setPipelineByStage: (pipelineByStage) => set({ pipelineByStage }),
  setWinRate: (winRate) => set({ winRate }),
  setTableStats: (tableStats) => set({ tableStats }),
  setLoading: (isLoading) => set({ isLoading }),

  loadUsers: async () => {
    set({ isLoading: true });
    try {
      if (!isTauriApp()) {
        const { mockUsers } = await import('@/lib/mock/admin');
        set({ users: mockUsers });
        return;
      }
      const { queryAllUsers } = await import('@/lib/db/queries/users');
      const users = await queryAllUsers();
      set({ users });
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
      if (!isTauriApp()) {
        const { mockAuditEntries } = await import('@/lib/mock/admin');
        const filters = get().auditFilters;
        let filtered = mockAuditEntries;
        if (filters.entityType) filtered = filtered.filter((e) => e.entityType === filters.entityType);
        if (filters.action) filtered = filtered.filter((e) => e.action === filters.action);
        if (filters.changedById) filtered = filtered.filter((e) => e.changedById === filters.changedById);
        if (filters.dateFrom) filtered = filtered.filter((e) => e.changedAt >= filters.dateFrom!);
        if (filters.dateTo) filtered = filtered.filter((e) => e.changedAt <= filters.dateTo!);
        const totalCount = filtered.length;
        const entries = filtered.slice(filters.offset, filters.offset + filters.limit);
        set({ auditEntries: entries, auditTotalCount: totalCount });
        return;
      }
      const { queryAuditLog, queryAuditLogCount } = await import('@/lib/db/queries/auditLog');
      const filters = get().auditFilters;
      const [entries, totalCount] = await Promise.all([
        queryAuditLog(filters),
        queryAuditLogCount(filters),
      ]);
      set({ auditEntries: entries, auditTotalCount: totalCount });
    } finally {
      set({ isLoading: false });
    }
  },

  loadSyncAdmin: async () => {
    set({ isLoading: true });
    try {
      if (!isTauriApp()) {
        const { mockSyncHealth, mockSyncErrors } = await import('@/lib/mock/admin');
        set({ syncHealth: mockSyncHealth, syncErrors: mockSyncErrors });
        return;
      }
      const { querySyncHealthMetrics, querySyncErrors } = await import('@/lib/db/queries/adminAnalytics');
      const [health, errors] = await Promise.all([
        querySyncHealthMetrics(),
        querySyncErrors(),
      ]);
      set({ syncHealth: health, syncErrors: errors });
    } finally {
      set({ isLoading: false });
    }
  },

  loadAnalytics: async () => {
    set({ isLoading: true });
    try {
      if (!isTauriApp()) {
        const {
          mockDataQuality, mockActivityByType, mockActivityByMonth,
          mockActivityByUser, mockPipelineByStage, mockWinRate,
        } = await import('@/lib/mock/admin');
        set({
          dataQuality: mockDataQuality, activityByType: mockActivityByType,
          activityByMonth: mockActivityByMonth, activityByUser: mockActivityByUser,
          pipelineByStage: mockPipelineByStage, winRate: mockWinRate,
        });
        return;
      }
      const {
        queryDataQualityMetrics,
        queryActivityBreakdownByType,
        queryActivityBreakdownByMonth,
        queryActivityBreakdownByUser,
        queryPipelineByStage,
        queryWinRate,
      } = await import('@/lib/db/queries/adminAnalytics');

      const [dataQuality, activityByType, activityByMonth, activityByUser, pipelineByStage, winRate] =
        await Promise.all([
          queryDataQualityMetrics(),
          queryActivityBreakdownByType(),
          queryActivityBreakdownByMonth(),
          queryActivityBreakdownByUser(),
          queryPipelineByStage(),
          queryWinRate(),
        ]);

      set({ dataQuality, activityByType, activityByMonth, activityByUser, pipelineByStage, winRate });
    } finally {
      set({ isLoading: false });
    }
  },

  loadDataManagement: async () => {
    set({ isLoading: true });
    try {
      if (!isTauriApp()) {
        const { mockTableStats } = await import('@/lib/mock/admin');
        set({ tableStats: mockTableStats });
        return;
      }
      const { queryTableStats } = await import('@/lib/db/queries/adminAnalytics');
      const tableStats = await queryTableStats();
      set({ tableStats });
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
