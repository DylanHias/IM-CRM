import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/db/client', async () => ({ getDb: (await import('./sqliteFixture')).fixtureGetDb }));

import { queryArrToday, queryArrMovement, queryArrMovers } from '@/lib/db/queries/reports/arr';
import type { ReportScope } from '@/lib/reports/scope';
import type { ReportPeriod } from '@/lib/reports/period';
import { resetFixture, addCustomer, addRevenue, addMovement } from './sqliteFixture';

const team: ReportScope = { kind: 'team', region: 'BENELUX' };
const mine: ReportScope = { kind: 'mine', userIds: ['u1'] };
const period: ReportPeriod = { kind: 'rolling', months: 3 };

beforeEach(() => {
  resetFixture();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 16)); // last complete month is 2026-09
});
afterEach(() => vi.useRealTimers());

describe('queryArrToday', () => {
  it('ignores deactivated accounts', async () => {
    addCustomer('a', 'u1', 'BE');
    addCustomer('dead', 'u1', 'BE', { status: 'inactive' });
    addRevenue('r1', 'a', 100);
    addRevenue('r2', 'dead', 900);
    expect(await queryArrToday(mine)).toEqual({ total: 100, matched: 1, unmatched: 0 });
  });

  it('counts accounts with no Power BI row as unmatched, not as zero ARR', async () => {
    addCustomer('a', 'u1', 'BE');
    addCustomer('b', 'u1', 'NL');
    addCustomer('c', 'u1', 'LU');
    addRevenue('B1', 'a', 100);
    addRevenue('B2', 'b', 250);
    expect(await queryArrToday(team)).toEqual({ total: 350, matched: 2, unmatched: 1 });
  });

  it('sums every revenue row of a customer and ignores accounts outside the scope', async () => {
    addCustomer('a', 'u1', 'BE');
    addCustomer('b', 'u2', 'BE');
    addRevenue('B1', 'a', 100);
    addRevenue('B1', 'a', 40);
    addRevenue('B2', 'a', 10);
    addRevenue('B3', 'b', 999);
    expect(await queryArrToday(mine)).toEqual({ total: 150, matched: 1, unmatched: 0 });
  });

  it('returns zeros when no account is in scope', async () => {
    expect(await queryArrToday(team)).toEqual({ total: 0, matched: 0, unmatched: 0 });
  });
});

describe('queryArrMovement', () => {
  it('does not multiply movement when a BCN has several revenue rows', async () => {
    addCustomer('a', 'u1', 'BE');
    addRevenue('B1', 'a', 100);
    addRevenue('B1', 'a', 200);
    addRevenue('B1', 'a', 300);
    addMovement('B1', '2026-09', { newSale: 1000 });
    const res = await queryArrMovement(team, period);
    expect(res.newSale).toBe(1000);
    expect(res.unmatchedBcns).toBe(0);
  });

  it('nets new sale + upgrade - downgrade - cancellation', async () => {
    addCustomer('a', 'u1', 'BE');
    addRevenue('B1', 'a', 1);
    addMovement('B1', '2026-09', { newSale: 1000, upgrade: 200, downgrade: 150, cancellation: 50 });
    expect(await queryArrMovement(team, period)).toMatchObject({
      newSale: 1000, upgrade: 200, downgrade: 150, cancellation: 50, net: 1000,
    });
  });

  it('only counts the period months, never the partial current month', async () => {
    addCustomer('a', 'u1', 'BE');
    addRevenue('B1', 'a', 1);
    addMovement('B1', '2026-06', { newSale: 1 });
    addMovement('B1', '2026-07', { newSale: 10 });
    addMovement('B1', '2026-09', { newSale: 100 });
    addMovement('B1', '2026-10', { newSale: 1000 });
    expect((await queryArrMovement(team, period)).newSale).toBe(110);
  });

  it('scopes Mine by owner and Team by country', async () => {
    addCustomer('a', 'u1', 'BE');
    addCustomer('b', 'u2', 'NL');
    addCustomer('c', 'u2', 'DE');
    addRevenue('B1', 'a', 1);
    addRevenue('B2', 'b', 1);
    addRevenue('B3', 'c', 1);
    for (const bcn of ['B1', 'B2', 'B3']) addMovement(bcn, '2026-09', { newSale: 10 });
    expect((await queryArrMovement(mine, period)).newSale).toBe(10);
    expect((await queryArrMovement(team, period)).newSale).toBe(20);
  });

  it('reports a BCN with no revenue row as unmatched, excluded from scoped totals', async () => {
    addCustomer('a', 'u1', 'BE');
    addRevenue('B1', 'a', 1);
    addMovement('B1', '2026-09', { newSale: 100 });
    addMovement('ORPHAN', '2026-09', { newSale: 70, cancellation: 20 });
    const res = await queryArrMovement(team, period);
    expect(res.newSale).toBe(100);
    expect(res).toMatchObject({ unmatchedBcns: 1, unmatchedNet: 50 });
  });

  it('routes a BCN resolving to two customers to unmatched, in neither customer', async () => {
    addCustomer('a', 'u1', 'BE');
    addCustomer('b', 'u2', 'BE');
    addRevenue('SPLIT', 'a', 1);
    addRevenue('SPLIT', 'b', 1);
    addMovement('SPLIT', '2026-09', { newSale: 500 });
    const res = await queryArrMovement(team, period);
    expect(res.newSale).toBe(0);
    expect((await queryArrMovement(mine, period)).newSale).toBe(0);
    expect(res).toMatchObject({ unmatchedBcns: 1, unmatchedNet: 500 });
  });

  it('returns zeros, not nulls, when the period has no movement rows', async () => {
    expect(await queryArrMovement(team, period)).toEqual({
      newSale: 0, upgrade: 0, downgrade: 0, cancellation: 0, net: 0, unmatchedBcns: 0, unmatchedNet: 0,
    });
  });

  it('returns zeros for a quarter that has not started', async () => {
    expect((await queryArrMovement(team, { kind: 'quarter', year: 2026, quarter: 4 })).net).toBe(0);
  });
});

describe('queryArrMovers', () => {
  it('ranks customers by absolute net movement and honours the limit', async () => {
    addCustomer('a', 'u1', 'BE');
    addCustomer('b', 'u1', 'BE');
    addRevenue('B1', 'a', 1);
    addRevenue('B1', 'a', 1);
    addRevenue('B2', 'b', 1);
    addMovement('B1', '2026-09', { newSale: 100, downgrade: 30 });
    addMovement('B2', '2026-09', { cancellation: 300 });
    const rows = await queryArrMovers(team, period, 1);
    expect(rows).toEqual([
      { customerId: 'b', name: 'Customer b', newSale: 0, upgrade: 0, downgrade: 0, cancellation: 300, net: -300 },
    ]);
    expect((await queryArrMovers(team, period, 5)).map((r) => r.net)).toEqual([-300, 70]);
  });
});
