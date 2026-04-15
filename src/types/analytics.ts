export type PeriodKey = '7d' | '30d' | '90d' | '6m' | '1y';

export interface DateRange {
  from: string;
  to: string;
}

// ── Personal ─────────────────────────────────────────────
export interface PersonalStats {
  activityCount: { current: number; previous: number };
  activityTimeline: { date: string; count: number }[];
  followUpCompletion: { completed: number; total: number; avgDaysToComplete: number };
  pipeline: { openCount: number; openValue: number; weightedForecast: number };
  winRate: { won: number; lost: number };
}

// ── Pipeline ─────────────────────────────────────────────
export interface ForecastPoint {
  month: string;
  weighted: number;
  total: number;
}

export interface ExpiringOpportunity {
  id: string;
  subject: string;
  estimatedRevenue: number | null;
  expirationDate: string;
  stage: string;
  customerName: string;
}

export interface DealBySellType {
  sellType: string;
  count: number;
  avgRevenue: number;
  totalRevenue: number;
}

export interface DealByVendor {
  vendor: string;
  count: number;
  avgRevenue: number;
}

export interface StageFunnelPoint {
  stage: string;
  count: number;
  totalRevenue: number;
}

export interface PipelineData {
  kpis: { openCount: number; openValue: number; weightedForecast: number; multiVendorRate: number };
  forecast: ForecastPoint[];
  expiring: ExpiringOpportunity[];
  bySellType: DealBySellType[];
  byVendor: DealByVendor[];
  stageFunnel: StageFunnelPoint[];
  winRate: { won: number; lost: number; open: number };
}

// ── Customers ────────────────────────────────────────────
export interface ArrByDimensionPoint {
  label: string;
  totalArr: number;
  customerCount: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  arr: number;
  industry: string | null;
  country: string | null;
}

export interface CustomerHealthData {
  stale: { count30: number; count60: number; count90: number; total: number; cloudCount: number };
  cloudBySegment: { segment: string; cloud: number; total: number }[];
  arrDistribution: { bucket: string; count: number }[];
  arrByIndustry: ArrByDimensionPoint[];
  arrBySegment: ArrByDimensionPoint[];
  arrByCountry: ArrByDimensionPoint[];
  topByArr: TopCustomer[];
  contactCoverage: { withContacts: number; withoutContacts: number; avgContactsPerCustomer: number };
}

// ── Activity ─────────────────────────────────────────────
export interface ActivityTypeRow {
  type: string;
  mine: number;
  team: number;
}

export interface ActivityPatternsData {
  callDirection: { incoming: number; outgoing: number; unknown: number };
  typeMix: ActivityTypeRow[];
  heatmap: { dayOfWeek: number; count: number }[];
  mostActiveCustomers: { customerId: string; name: string; count: number }[];
}
