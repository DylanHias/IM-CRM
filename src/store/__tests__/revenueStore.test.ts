import { describe, it, expect } from 'vitest';
import { useRevenueStore, type CustomerRevenueRow } from '../revenueStore';

function revenueRow(over: Partial<CustomerRevenueRow>): CustomerRevenueRow {
  return {
    bcn: 'B1', customerId: 'c1', pbiCustomerId: null, resellerAccount: null,
    arrUsd: null, arrLc: null, currencyCode: null, asOfMonth: null,
    activeEndCustomers: null, refreshedAt: '2026-01-01',
    ...over,
  };
}

describe('revenueStore.setRevenue', () => {
  it('sums rows sharing a bcn instead of overwriting', () => {
    useRevenueStore.getState().setRevenue(
      [revenueRow({ arrLc: 1000, arrUsd: 1100 }), revenueRow({ arrLc: 500, arrUsd: 550 })],
      null,
    );
    const r = useRevenueStore.getState().byBcn.get('B1');
    expect(r?.arrLc).toBe(1500);
    expect(r?.arrUsd).toBe(1650);
  });

  it('sums rows sharing a reseller account and keeps null when every value is null', () => {
    useRevenueStore.getState().setRevenue(
      [
        revenueRow({ bcn: 'B1', resellerAccount: 'A', arrLc: 10 }),
        revenueRow({ bcn: 'B2', resellerAccount: 'A', arrLc: 5 }),
      ],
      null,
    );
    const r = useRevenueStore.getState().byResellerAccount.get('A');
    expect(r?.arrLc).toBe(15);
    expect(r?.arrUsd).toBeNull();
  });
});
