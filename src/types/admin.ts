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
  analyticsTracked: boolean;
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

// ── Team Analytics ──────────────────────────────────────────────────────────

export type AnalyticsRangeKey = '7d' | '30d' | '90d' | 'qtd';

export interface AnalyticsRange {
  start: string; // ISO datetime
  end: string;   // ISO datetime
  key: AnalyticsRangeKey;
}

export interface LeaderboardRow {
  userId: string;
  userName: string;
  email: string;
  title: string | null;
  profilePhoto: string | null;
  // Activities (split by type)
  activityTotal: number;
  meetings: number;
  calls: number;
  visits: number;
  notes: number;
  // Follow-ups
  followupsCreated: number;
  followupsCompleted: number;
  followupCompletionPct: number;
  // Opportunities
  oppsCreated: number;
  oppsCreatedValue: number;     // sum of estimated_revenue for opps created in range
  oppsWon: number;
  oppsWonValue: number;
  oppsLost: number;
  winRatePct: number | null;     // null when no closed deals in range
  // Reach
  customersTouched: number;      // distinct customers with activity in range
}

export interface DrilldownTimelinePoint {
  date: string; // yyyy-mm-dd
  meeting: number;
  call: number;
  visit: number;
  note: number;
}

export interface DrilldownActivity {
  id: string;
  type: 'meeting' | 'call' | 'visit' | 'note';
  subject: string;
  customerId: string;
  customerName: string;
  occurredAt: string;
}

export interface DrilldownOpenOpp {
  id: string;
  subject: string;
  customerId: string;
  customerName: string;
  stage: string;
  estimatedRevenue: number | null;
  expirationDate: string | null;
  probability: number;
}

export interface DrilldownStaleCustomer {
  id: string;
  name: string;
  lastActivityAt: string | null;
  daysSince: number | null;
}

export interface DrilldownOverdueFollowup {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  dueDate: string;
  daysOverdue: number;
}

export interface UserDrilldown {
  userId: string;
  timeline: DrilldownTimelinePoint[];
  recentActivities: DrilldownActivity[];
  openOpps: DrilldownOpenOpp[];
  openOppsValue: number;
  staleCustomers: DrilldownStaleCustomer[];
  overdueFollowups: DrilldownOverdueFollowup[];
}

export interface ZeroActivityUser {
  userId: string;
  userName: string;
  profilePhoto: string | null;
  lastActivityAt: string | null;
}

export interface OverdueFollowupSummary {
  userId: string;
  userName: string;
  profilePhoto: string | null;
  count: number;
}
