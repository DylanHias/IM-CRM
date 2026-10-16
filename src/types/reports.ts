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
