import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/db/client', async () => ({ getDb: (await import('./sqliteFixture')).fixtureGetDb }));

import {
  queryAccountSummary,
  queryTopConcentration,
  queryAccountsRanked,
  queryArrByDimension,
  queryCoverageBuckets,
} from '@/lib/db/queries/reports/accounts';
import type { ReportScope } from '@/lib/reports/scope';
import { resetFixture, addCustomer, addRevenue, addOpportunity, addActivity } from './sqliteFixture';

const mine: ReportScope = { kind: 'mine', userIds: ['u1'] };
const team: ReportScope = { kind: 'team', region: 'BENELUX' };
// Fake "now" is 2026-10-16 13:00 local.
const daysAgo = (d: number) => new Date(2026, 9, 16 - d, 12).toISOString();
const daysAhead = (d: number) => daysAgo(-d);

beforeEach(() => {
  resetFixture();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 16, 13));
});
afterEach(() => vi.useRealTimers());

const buckets = async (s: ReportScope) => Object.fromEntries((await queryCoverageBuckets(s)).map((b) => [b.bucket, b.count]));

describe('queryAccountSummary', () => {
  it('counts never-contacted accounts apart from the 90-day-quiet ones', async () => {
    addCustomer('old', 'u1', 'BE');
    addCustomer('never', 'u1', 'BE');
    addActivity('old', daysAgo(100));
    const r = await queryAccountSummary(mine);
    expect(r.notContacted90d).toBe(1);
    expect(r.neverContacted).toBe(1);
    expect(r.total).toBe(2);
  });

  it('does not let a future-dated activity make an account look recently contacted', async () => {
    addCustomer('a', 'u1', 'BE');
    addActivity('a', daysAgo(100));
    addActivity('a', daysAhead(30));
    expect((await queryAccountSummary(mine)).notContacted90d).toBe(1);
  });

  it('counts an account touched by any activity, whoever logged it', async () => {
    addCustomer('a', 'u1', 'BE');
    addActivity('a', daysAgo(5), 'u2'); // logged by someone else, still counts for u1's account
    const r = await queryAccountSummary(mine);
    expect(r.notContacted90d).toBe(0);
    expect(r.neverContacted).toBe(0);
  });

  it('counts accounts with ARR by summing reseller rows, and without open deals', async () => {
    addCustomer('a', 'u1', 'BE');
    addCustomer('b', 'u1', 'BE');
    addCustomer('c', 'u1', 'BE');
    addRevenue('r1', 'a', 60);
    addRevenue('r2', 'a', -60); // sums to 0, so not "with ARR"
    addRevenue('r3', 'b', 10);
    addOpportunity({ customerId: 'b' });
    addOpportunity({ customerId: 'c', status: 'Won' });
    const r = await queryAccountSummary(mine);
    expect(r.withArr).toBe(1);
    expect(r.noOpenOpp).toBe(2);
  });

  it('is zero across the board for an empty scope', async () => {
    expect(await queryAccountSummary(mine)).toEqual({ total: 0, withArr: 0, noOpenOpp: 0, notContacted90d: 0, neverContacted: 0 });
  });

  it('scopes team to the region regardless of owner', async () => {
    addCustomer('a', 'u2', 'NL');
    addCustomer('b', 'u1', 'DE');
    expect((await queryAccountSummary(team)).total).toBe(1);
  });
});

describe('queryTopConcentration', () => {
  it('returns the percentage of ARR held by the top n accounts, summing reseller rows', async () => {
    for (const id of ['a', 'b', 'c']) addCustomer(id, 'u1', 'BE');
    addRevenue('r1', 'a', 30);
    addRevenue('r2', 'a', 30); // a = 60
    addRevenue('r3', 'b', 30);
    addRevenue('r4', 'c', 10);
    expect(await queryTopConcentration(mine, 1)).toBeCloseTo(60);
    expect(await queryTopConcentration(mine, 2)).toBeCloseTo(90);
    expect(await queryTopConcentration(mine, 10)).toBeCloseTo(100);
  });

  it('returns null when scope holds no ARR', async () => {
    addCustomer('a', 'u1', 'BE');
    expect(await queryTopConcentration(mine, 10)).toBeNull();
  });

  it('ignores ARR of accounts outside scope', async () => {
    addCustomer('a', 'u1', 'BE');
    addCustomer('x', 'u2', 'DE');
    addRevenue('r1', 'a', 10);
    addRevenue('r2', 'x', 990);
    expect(await queryTopConcentration(mine, 1)).toBeCloseTo(100);
  });
});

describe('queryAccountsRanked', () => {
  it('ranks by summed ARR, with unmatched accounts last and ARR null rather than zero', async () => {
    for (const id of ['a', 'b', 'c']) addCustomer(id, 'u1', 'BE');
    addRevenue('r1', 'a', 20);
    addRevenue('r2', 'a', 20);
    addRevenue('r3', 'b', 30);
    const rows = await queryAccountsRanked(mine, 10, 0);
    expect(rows.map((r) => [r.id, r.arr])).toEqual([['a', 40], ['b', 30], ['c', null]]);
  });

  it('reports open deals and computed last contact per account', async () => {
    addCustomer('a', 'u1', 'BE');
    addCustomer('b', 'u1', 'BE');
    addOpportunity({ customerId: 'a' });
    addOpportunity({ customerId: 'a' });
    addOpportunity({ customerId: 'a', status: 'Lost' });
    addActivity('a', daysAgo(20));
    addActivity('a', daysAgo(3));
    addActivity('a', daysAhead(10));
    const [a, b] = await queryAccountsRanked(mine, 10, 0);
    expect(a.openDeals).toBe(2);
    expect(a.lastContactAt).toBe(daysAgo(3));
    expect(b.lastContactAt).toBeNull();
  });

  it('pages with limit and offset', async () => {
    for (const [id, arr] of [['a', 3], ['b', 2], ['c', 1]] as const) {
      addCustomer(id, 'u1', 'BE');
      addRevenue(`r${id}`, id, arr);
    }
    expect((await queryAccountsRanked(mine, 1, 1)).map((r) => r.id)).toEqual(['b']);
  });
});

describe('queryArrByDimension', () => {
  it('gives a null segment its own "Not set" row so the bars reconcile to the total', async () => {
    addCustomer('a', 'u1', 'BE', { segment: 'Enterprise' });
    addCustomer('b', 'u1', 'BE', { segment: null });
    addCustomer('c', 'u1', 'BE', { segment: '  ' });
    addRevenue('r1', 'a', 100);
    addRevenue('r2', 'b', 20);
    addRevenue('r3', 'c', 5);
    const rows = await queryArrByDimension(mine, 'segment');
    expect(rows).toEqual([
      { label: 'Enterprise', arr: 100, accounts: 1, matched: 1 },
      { label: 'Not set', arr: 25, accounts: 2, matched: 2 },
    ]);
    expect(rows.reduce((t, r) => t + r.arr, 0)).toBe(125);
  });

  it('sums reseller rows and reports how many accounts matched, so unmatched ones are not read as zero ARR', async () => {
    addCustomer('a', 'u1', 'BE', { industry: 'Retail' });
    addCustomer('b', 'u1', 'BE', { industry: 'Retail' });
    addCustomer('c', 'u1', 'BE', { industry: 'Fashion' });
    addRevenue('r1', 'a', 10);
    addRevenue('r2', 'a', 15);
    expect(await queryArrByDimension(mine, 'industry')).toEqual([
      { label: 'Retail', arr: 25, accounts: 2, matched: 1 },
      { label: 'Fashion', arr: 0, accounts: 1, matched: 0 },
    ]);
  });

  it('groups by country code', async () => {
    addCustomer('a', 'u1', 'BE');
    addCustomer('b', 'u1', 'NL');
    addRevenue('r1', 'a', 1);
    addRevenue('r2', 'b', 2);
    expect((await queryArrByDimension(mine, 'country')).map((r) => r.label)).toEqual(['NL', 'BE']);
  });

  it('returns every group, leaving truncation to the caller', async () => {
    for (let i = 1; i <= 12; i++) {
      addCustomer(`c${i}`, 'u1', 'BE', { segment: `S${i}` });
      addRevenue(`r${i}`, `c${i}`, i);
    }
    expect(await queryArrByDimension(mine, 'segment')).toHaveLength(12);
  });
});

describe('queryCoverageBuckets', () => {
  it('puts each account in exactly one bucket by days since last contact', async () => {
    const seed: [string, string | null][] = [
      ['fresh', daysAgo(5)], ['d30', daysAgo(30)], ['d45', daysAgo(45)],
      ['d75', daysAgo(75)], ['d200', daysAgo(200)], ['never', null],
    ];
    for (const [id, when] of seed) {
      addCustomer(id, 'u1', 'BE');
      if (when) addActivity(id, when);
    }
    expect(await buckets(mine)).toEqual({ '0-30': 2, '31-60': 1, '61-90': 1, '90+': 1, never: 1 });
  });

  it('uses the latest past activity and ignores future ones', async () => {
    addCustomer('a', 'u1', 'BE');
    addActivity('a', daysAgo(120));
    addActivity('a', daysAhead(20));
    expect(await buckets(mine)).toMatchObject({ '90+': 1, '0-30': 0, never: 0 });
  });

  it('returns every bucket, with zeros, for an empty scope', async () => {
    expect(await buckets(mine)).toEqual({ '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0, never: 0 });
  });
});

describe('coverage edges', () => {
  it.each([
    [30, '0-30'], [31, '31-60'], [60, '31-60'], [61, '61-90'], [90, '61-90'], [91, '90+'],
  ] as const)('puts an account last contacted %i days ago in %s', async (days, bucket) => {
    addCustomer('a', 'u1', 'BE');
    addActivity('a', daysAgo(days));
    expect((await buckets(mine))[bucket]).toBe(1);
  });

  it('keeps notContacted90d equal to the 90+ bucket', async () => {
    for (const [id, d] of [['a', 90], ['b', 91], ['c', 200], ['d', 5]] as const) {
      addCustomer(id, 'u1', 'BE');
      addActivity(id, daysAgo(d));
    }
    addCustomer('never', 'u1', 'BE');
    expect((await queryAccountSummary(mine)).notContacted90d).toBe((await buckets(mine))['90+']);
    expect((await buckets(mine))['90+']).toBe(2);
  });
});

describe('deactivated accounts', () => {
  it('are left out of every account metric', async () => {
    addCustomer('live', 'u1', 'BE', { segment: 'SMB' });
    addCustomer('dead', 'u1', 'BE', { segment: 'SMB', status: 'inactive' });
    addRevenue('r1', 'live', 10);
    addRevenue('r2', 'dead', 990);
    expect((await queryAccountSummary(mine)).total).toBe(1);
    expect((await queryAccountsRanked(mine, 10, 0)).map((r) => r.id)).toEqual(['live']);
    expect(await queryArrByDimension(mine, 'segment')).toEqual([{ label: 'SMB', arr: 10, accounts: 1, matched: 1 }]);
    expect(await queryTopConcentration(mine, 1)).toBeCloseTo(100);
    expect(Object.values(await buckets(mine)).reduce((t, n) => t + n, 0)).toBe(1);
  });
});
