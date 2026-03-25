export type UserRole = 'admin' | 'user';

export interface CrmUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  businessUnit: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AuditAction = 'create' | 'update' | 'delete';

export type AuditEntityType = 'customer' | 'contact' | 'activity' | 'follow_up' | 'opportunity';

export interface AuditLogEntry {
  id: number;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  changedById: string;
  changedByName: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedAt: string;
}

export interface SyncHealthMetrics {
  totalSyncs: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgDurationMs: number;
  totalRecordsProcessed: number;
}

export interface DataQualityMetrics {
  customersWithoutContacts: number;
  customersWithoutRecentActivity: number;
  staleOpportunities: number;
  totalCustomers: number;
  totalContacts: number;
  totalActivities: number;
}

export interface TableStats {
  tableName: string;
  rowCount: number;
}

export interface ActivityBreakdown {
  type: string;
  count: number;
}

export interface PipelineStats {
  stage: string;
  count: number;
  totalRevenue: number;
}

export interface AuditLogFilters {
  entityType?: AuditEntityType;
  action?: AuditAction;
  changedById?: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  offset: number;
}
