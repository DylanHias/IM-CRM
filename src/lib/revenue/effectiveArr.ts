import type { Customer } from '@/types/entities';
import type { CustomerRevenueRow } from '@/store/revenueStore';

export type Currency = 'USD' | 'LC';
export type ArrSource = 'powerbi' | 'd365' | 'none';

export interface EffectiveArr {
  value: number | null;
  currency: string | null;
  source: ArrSource;
  asOfMonth: string | null;
}

/**
 * Resolves the ARR value to display for a customer, preferring the Power BI cache
 * when available and falling back to the D365-synced value.
 */
export function getEffectiveArr(
  customer: Pick<Customer, 'arr' | 'arrCurrency'>,
  revenue: CustomerRevenueRow | null,
  _preferredCurrency?: Currency,
): EffectiveArr {
  if (revenue && revenue.arrLc !== null) {
    return {
      value: revenue.arrLc,
      currency: 'EUR',
      source: 'powerbi',
      asOfMonth: revenue.asOfMonth,
    };
  }
  if (customer.arr !== null && customer.arr !== undefined) {
    return {
      value: customer.arr,
      currency: 'EUR',
      source: 'd365',
      asOfMonth: null,
    };
  }
  return { value: null, currency: null, source: 'none', asOfMonth: null };
}
