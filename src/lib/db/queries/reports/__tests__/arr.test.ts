import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const select = vi.fn();

vi.mock('@/lib/db/client', () => ({
  getDb: vi.fn(async () => ({ select, execute: vi.fn() })),
}));

import { queryArrToday, queryArrMovement, queryArrMovers } from '@/lib/db/queries/reports/arr';
import type { ReportScope } from '@/lib/reports/scope';
import type { ReportPeriod } from '@/lib/reports/period';

const scope: ReportScope = { kind: 'team', region: 'BENELUX' };
const period: ReportPeriod = { kind: 'rolling', months: 3 };

beforeEach(() => {
  select.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 16)); // 16 Oct 2026 -> last complete month is 2026-09
});
afterEach(() => vi.useRealTimers());

describe('queryArrToday', () => {
  it('counts accounts with no Power BI row as unmatched, not as zero ARR', async () => {
    select.mockResolvedValueOnce([{ total: 5000, matched: 2, accounts: 3 }]);
    expect(await queryArrToday(scope)).toEqual({ total: 5000, matched: 2, unmatched: 1 });
  });

  it('sums every revenue row per customer and keeps unmatched accounts via LEFT JOIN', async () => {
    select.mockResolvedValueOnce([{ total: 0, matched: 0, accounts: 0 }]);
    await queryArrToday(scope);
    const [sql, params] = select.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('SUM(arr_lc)');
    expect(sql).toContain('GROUP BY customer_id');
    expect(sql).toContain('LEFT JOIN');
    expect(sql).not.toContain('arr_usd');
    expect(params).toEqual(['BE', 'NL', 'LU']);
  });

  it('returns zeros for an empty result', async () => {
    select.mockResolvedValueOnce([]);
    expect(await queryArrToday(scope)).toEqual({ total: 0, matched: 0, unmatched: 0 });
  });
});

describe('queryArrMovement', () => {
  it('sums ARR movement over the period months only', async () => {
    select.mockResolvedValueOnce([]);
    await queryArrMovement(scope, period);
    const [sql, params] = select.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('month >= $4');
    expect(sql).toContain('month <= $5');
    expect(params).toEqual(['BE', 'NL', 'LU', '2026-07', '2026-09']);
    expect(params).not.toContain('2026-10');
  });

  it('does not multiply movement when a BCN has several revenue rows', async () => {
    select.mockResolvedValueOnce([]);
    await queryArrMovement(scope, period);
    const [sql] = select.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('GROUP BY bcn');
    expect(sql).not.toMatch(/JOIN customer_revenue/);
  });

  it('reads only the local-currency columns', async () => {
    select.mockResolvedValueOnce([]);
    await queryArrMovement(scope, period);
    const [sql] = select.mock.calls[0] as [string, unknown[]];
    expect(sql).not.toContain('_usd');
  });

  it('nets movement as new sale + upgrade - downgrade - cancellation', async () => {
    select.mockResolvedValueOnce([{ new_sale: 1000, upgrade: 200, downgrade: 150, cancellation: 50 }]);
    expect(await queryArrMovement(scope, period)).toEqual({
      newSale: 1000, upgrade: 200, downgrade: 150, cancellation: 50, net: 1000,
    });
  });

  it('returns zeros, not nulls, when the period has no movement rows', async () => {
    select.mockResolvedValueOnce([]);
    expect(await queryArrMovement(scope, period)).toEqual({
      newSale: 0, upgrade: 0, downgrade: 0, cancellation: 0, net: 0,
    });
  });
});

describe('queryArrMovers', () => {
  it('maps rows, nets each customer and passes the limit last', async () => {
    select.mockResolvedValueOnce([
      { customer_id: 'c1', name: 'Acme', new_sale: 100, upgrade: 0, downgrade: 30, cancellation: 0 },
    ]);
    const rows = await queryArrMovers(scope, period, 5);
    const [sql, params] = select.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('LIMIT $6');
    expect(params).toEqual(['BE', 'NL', 'LU', '2026-07', '2026-09', 5]);
    expect(rows).toEqual([
      { customerId: 'c1', name: 'Acme', newSale: 100, upgrade: 0, downgrade: 30, cancellation: 0, net: 70 },
    ]);
  });
});
