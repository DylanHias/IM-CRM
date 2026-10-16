export interface ArrToday {
  total: number;
  matched: number;
  unmatched: number;
}

export interface ArrFlows {
  newSale: number;
  upgrade: number;
  downgrade: number;
  cancellation: number;
  net: number;
}

export interface ArrMovement extends ArrFlows {
  /** BCNs with movement that cannot be tied to exactly one customer (no revenue row, or several customers). */
  unmatchedBcns: number;
  unmatchedNet: number;
}

export interface ArrMover extends ArrFlows {
  customerId: string;
  name: string;
}

export interface Money {
  value: number;
  count: number;
  excludedNonEur: number;
}

export interface MonthTotal {
  month: string;
  count: number;
  value: number;
}

export interface ClosedMonth {
  month: string;
  won: { count: number; value: number };
  lost: { count: number; value: number };
}

export interface BreakdownRow extends Money {
  label: string;
}

export interface Forecast {
  /** month is a YYYY-MM key, or the sentinel "overdue" for expected closes already in the past. */
  buckets: { month: string; value: number }[];
  noCloseDateCount: number;
  noCloseDateValue: number;
  excludedNonEur: number;
}

export interface QuietDeal {
  id: string;
  subject: string;
  customerId: string;
  customerName: string;
  stage: string;
  value: number;
  currency: string;
  /** Latest activity not in the future; null = the account was never contacted. */
  lastActivityAt: string | null;
  daysStale: number | null;
}

export type CoverageBucket = '0-30' | '31-60' | '61-90' | '90+' | 'never';

export interface AccountSummary {
  total: number;
  /** Accounts whose summed Power BI ARR is above zero. */
  withArr: number;
  noOpenOpp: number;
  /** Contacted before, but not within 90 days. Never-contacted accounts are counted apart. */
  notContacted90d: number;
  neverContacted: number;
}

export interface RankedAccount {
  id: string;
  name: string;
  /** null = no matching Power BI row (unmatched), which is not the same as zero ARR. */
  arr: number | null;
  /** Latest activity not in the future; null = never contacted. */
  lastContactAt: string | null;
  openDeals: number;
}

export interface DimensionRow {
  label: string;
  arr: number;
  accounts: number;
  /** Accounts with a Power BI row. Fewer than `accounts` means some are unmatched and add no ARR. */
  matched: number;
}
