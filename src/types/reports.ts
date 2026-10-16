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
  lastActivityAt: string;
  daysStale: number;
}
