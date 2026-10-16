export interface ArrToday {
  total: number;
  matched: number;
  unmatched: number;
}

export interface ArrMovement {
  newSale: number;
  upgrade: number;
  downgrade: number;
  cancellation: number;
  net: number;
}

export interface ArrMover extends ArrMovement {
  customerId: string;
  name: string;
}
