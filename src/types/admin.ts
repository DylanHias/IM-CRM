export type UserRole = 'admin' | 'user';

export interface CrmUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  businessUnit: string | null;
  title: string | null;
  lastActiveAt: string | null;
  profilePhoto: string | null;
  createdAt: string;
  updatedAt: string;
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

export interface SavedQuery {
  id: number;
  name: string;
  sql: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityBreakdown {
  type: string;
  count: number;
}

export interface UserActivityBreakdown {
  userName: string;
  count: number;
  meeting: number;
  call: number;
  visit: number;
  note: number;
}

export interface ActivityTimelinePoint {
  date: string;
  meeting: number;
  call: number;
  visit: number;
  note: number;
}

export interface PipelineStats {
  stage: string;
  count: number;
  totalRevenue: number;
}

