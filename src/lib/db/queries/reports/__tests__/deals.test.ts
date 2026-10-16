import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/db/client', async () => ({ getDb: (await import('./sqliteFixture')).fixtureGetDb }));

import {
  queryOpenPipeline,
  queryNewOpportunities,
  queryClosedDeals,
  queryAvgDealSize,
  queryPipelineByStage,
  queryPipelineByDimension,
  queryForecastByMonth,
  queryQuietDeals,
} from '@/lib/db/queries/reports/deals';
import type { ReportScope } from '@/lib/reports/scope';
import type { ReportPeriod } from '@/lib/reports/period';
import { resetFixture, addCustomer, addOpportunity, addActivity } from './sqliteFixture';

const mine: ReportScope = { kind: 'mine', userIds: ['u1'] };
const team: ReportScope = { kind: 'team', region: 'BENELUX' };
const period: ReportPeriod = { kind: 'rolling', months: 3 }; // 2026-07 .. 2026-09

beforeEach(() => {
  resetFixture();
  addCustomer('a', 'u1', 'BE');
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 16));
});
afterEach(() => vi.useRealTimers());

describe('queryOpenPipeline', () => {
  it('values deals by annual revenue, never raw estimated revenue', async () => {
    addOpportunity({ annual: 50000, estimated: 999999 });
    expect((await queryOpenPipeline(mine)).value).toBe(50000);
  });

  it('values a deal with no estimated revenue by its annual revenue instead of zero', async () => {
    addOpportunity({ annual: 50000, estimated: null });
    expect((await queryOpenPipeline(mine)).value).toBe(50000);
  });

  it('falls back to estimated revenue when annual revenue is missing', async () => {
    addOpportunity({ annual: null, estimated: 7000 });
    expect((await queryOpenPipeline(mine)).value).toBe(7000);
  });

  it('weights by probability on a 0-100 scale and ignores closed deals', async () => {
    addOpportunity({ annual: 100000, probability: 25 });
    addOpportunity({ annual: 40000, probability: 50 });
    addOpportunity({ annual: 999, status: 'Won' });
    expect(await queryOpenPipeline(mine)).toEqual({ value: 140000, count: 2, weighted: 45000, excludedNonEur: 0 });
  });

  it('excludes non-euro deals from money and reports how many', async () => {
    addOpportunity({ annual: 100000 });
    addOpportunity({ annual: 5000000, currency: 'USD' });
    addOpportunity({ annual: 8000, currency: 'GBP' });
    expect(await queryOpenPipeline(mine)).toEqual({ value: 100000, count: 1, weighted: 50000, excludedNonEur: 2 });
  });

  it('returns zeros for an empty pipeline', async () => {
    expect(await queryOpenPipeline(mine)).toEqual({ value: 0, count: 0, weighted: 0, excludedNonEur: 0 });
  });

  it('scopes to the owner for mine and to the region for team', async () => {
    addCustomer('nl', 'u2', 'NL');
    addCustomer('us', 'u1', 'US');
    addOpportunity({ annual: 10, owner: 'u1', customerId: 'a' });
    addOpportunity({ annual: 20, owner: 'u2', customerId: 'nl' });
    addOpportunity({ annual: 40, owner: 'u1', customerId: 'us' });
    expect((await queryOpenPipeline(mine)).value).toBe(50);
    expect((await queryOpenPipeline(team)).value).toBe(30);
  });
});

describe('queryNewOpportunities', () => {
  it('buckets by created_at month, fills empty months with zeros, and totals the period', async () => {
    addOpportunity({ annual: 100, createdAt: '2026-07-15T10:00:00Z' }); // D365 sync format
    addOpportunity({ annual: 50, createdAt: '2026-07-20 10:00:00' });
    addOpportunity({ annual: 300, createdAt: '2026-09-01 00:00:00', status: 'Won' });
    addOpportunity({ annual: 999, createdAt: '2026-06-30 23:00:00' }); // before the period
    addOpportunity({ annual: 999, createdAt: '2026-10-02 00:00:00' }); // partial current month
    const r = await queryNewOpportunities(mine, period);
    expect(r.byMonth).toEqual([
      { month: '2026-07', count: 2, value: 150 },
      { month: '2026-08', count: 0, value: 0 },
      { month: '2026-09', count: 1, value: 300 },
    ]);
    expect(r.total).toEqual({ count: 3, value: 450, excludedNonEur: 0 });
  });

  it('values by annual revenue and excludes non-euro deals', async () => {
    addOpportunity({ annual: 50000, estimated: null, createdAt: '2026-08-05 00:00:00' });
    addOpportunity({ annual: 70000, currency: 'USD', createdAt: '2026-08-06 00:00:00' });
    expect((await queryNewOpportunities(mine, period)).total).toEqual({ count: 1, value: 50000, excludedNonEur: 1 });
  });
});

describe('queryClosedDeals', () => {
  it('computes win rate by value, not deal count', async () => {
    addOpportunity({ status: 'Won', annual: 300000, closeDate: '2026-08-10' });
    addOpportunity({ status: 'Lost', annual: 50000, closeDate: '2026-08-12' });
    addOpportunity({ status: 'Lost', annual: 30000, closeDate: '2026-08-12' });
    addOpportunity({ status: 'Lost', annual: 20000, closeDate: '2026-08-12' });
    const r = await queryClosedDeals(mine, period);
    expect(r.won.count).toBe(1);
    expect(r.lost.count).toBe(3);
    expect(r.winRatePct).toBe(75);
  });

  it('returns null win rate when nothing has closed, even with open deals', async () => {
    addOpportunity({ annual: 5000 });
    const r = await queryClosedDeals(mine, period);
    expect(r.winRatePct).toBeNull();
    expect(r.won).toEqual({ value: 0, count: 0, excludedNonEur: 0 });
    expect(r.lost).toEqual({ value: 0, count: 0, excludedNonEur: 0 });
  });

  it('values a won deal by actual revenue when it is entered', async () => {
    addOpportunity({ status: 'Won', annual: 100000, actual: 90000, closeDate: '2026-08-10' });
    expect((await queryClosedDeals(mine, period)).won.value).toBe(90000);
  });

  it('falls back to ARR when actual revenue is zero, which means not entered', async () => {
    addOpportunity({ status: 'Won', annual: 100000, actual: 0, closeDate: '2026-08-10' });
    addOpportunity({ status: 'Won', annual: 20000, actual: null, closeDate: '2026-08-11' });
    expect((await queryClosedDeals(mine, period)).won.value).toBe(120000);
  });

  it('values lost deals by ARR even if an actual revenue is present', async () => {
    addOpportunity({ status: 'Lost', annual: 40000, actual: 1, closeDate: '2026-08-10' });
    addOpportunity({ status: 'Lost', annual: null, estimated: 2000, closeDate: '2026-08-10' });
    expect((await queryClosedDeals(mine, period)).lost.value).toBe(42000);
  });

  it('buckets by close_date, not created_at, and fills empty months', async () => {
    addOpportunity({ status: 'Won', annual: 100, createdAt: '2026-01-01 00:00:00', closeDate: '2026-09-03' });
    addOpportunity({ status: 'Lost', annual: 10, createdAt: '2026-09-01 00:00:00', closeDate: '2026-07-30' });
    addOpportunity({ status: 'Won', annual: 999, closeDate: '2026-06-30' }); // outside the period
    addOpportunity({ status: 'Won', annual: 999, closeDate: null }); // no close date
    const r = await queryClosedDeals(mine, period);
    expect(r.byMonth).toEqual([
      { month: '2026-07', won: { count: 0, value: 0 }, lost: { count: 1, value: 10 } },
      { month: '2026-08', won: { count: 0, value: 0 }, lost: { count: 0, value: 0 } },
      { month: '2026-09', won: { count: 1, value: 100 }, lost: { count: 0, value: 0 } },
    ]);
    expect(r.won.value).toBe(100);
    expect(r.lost.value).toBe(10);
  });

  it('excludes non-euro deals from value and win rate and counts them', async () => {
    addOpportunity({ status: 'Won', annual: 100, closeDate: '2026-08-01' });
    addOpportunity({ status: 'Won', annual: 9000, currency: 'USD', closeDate: '2026-08-01' });
    addOpportunity({ status: 'Lost', annual: 100, closeDate: '2026-08-01' });
    const r = await queryClosedDeals(mine, period);
    expect(r.won).toEqual({ value: 100, count: 1, excludedNonEur: 1 });
    expect(r.winRatePct).toBe(50);
  });

  it('returns a null win rate and no months for a quarter that has not started', async () => {
    addOpportunity({ status: 'Won', annual: 100, closeDate: '2026-08-01' });
    const r = await queryClosedDeals(mine, { kind: 'quarter', year: 2026, quarter: 4 });
    expect(r.byMonth).toEqual([]);
    expect(r.winRatePct).toBeNull();
  });
});

describe('queryAvgDealSize', () => {
  it('averages over deals that have a value, not over blanks', async () => {
    addOpportunity({ annual: 100000 });
    addOpportunity({ annual: 100000 });
    for (let i = 0; i < 8; i++) addOpportunity({ annual: null, estimated: null });
    expect(await queryAvgDealSize(mine)).toBe(100000);
  });

  it('treats a zero value as blank', async () => {
    addOpportunity({ annual: 0 });
    addOpportunity({ annual: 300 });
    expect(await queryAvgDealSize(mine)).toBe(300);
  });

  it('returns null average when no deal carries a value', async () => {
    addOpportunity({ annual: null, estimated: null });
    expect(await queryAvgDealSize(mine)).toBeNull();
  });

  it('averages open deals only, ignoring won and lost deals', async () => {
    addOpportunity({ annual: 100 });
    addOpportunity({ annual: 300 });
    addOpportunity({ annual: 9000, status: 'Won', actual: 9000 });
    addOpportunity({ annual: 5000, status: 'Lost' });
    expect(await queryAvgDealSize(mine)).toBe(200);
  });

  it('ignores non-euro deals', async () => {
    addOpportunity({ annual: 100 });
    addOpportunity({ annual: 9000, currency: 'USD' });
    expect(await queryAvgDealSize(mine)).toBe(100);
  });
});

describe('pipeline breakdowns', () => {
  it('groups open deals by stage with count and value', async () => {
    addOpportunity({ stage: 'Qualify', annual: 10 });
    addOpportunity({ stage: 'Qualify', annual: 20 });
    addOpportunity({ stage: 'Propose', annual: 100 });
    addOpportunity({ stage: 'Propose', annual: 7, status: 'Won' });
    expect(await queryPipelineByStage(mine)).toEqual([
      { label: 'Propose', count: 1, value: 100, excludedNonEur: 0 },
      { label: 'Qualify', count: 2, value: 30, excludedNonEur: 0 },
    ]);
  });

  it('groups a null vendor under "Not set" rather than dropping it, so bars sum to the total', async () => {
    addOpportunity({ vendor: 'Microsoft', annual: 60 });
    addOpportunity({ vendor: null, annual: 25 });
    addOpportunity({ vendor: '', annual: 15 });
    const rows = await queryPipelineByDimension(mine, 'vendor');
    expect(rows).toEqual([
      { label: 'Microsoft', count: 1, value: 60, excludedNonEur: 0 },
      { label: 'Not set', count: 2, value: 40, excludedNonEur: 0 },
    ]);
    expect(rows.reduce((t, r) => t + r.value, 0)).toBe((await queryOpenPipeline(mine)).value);
  });

  it('groups by sell type', async () => {
    addOpportunity({ sellType: 'New', annual: 5 });
    addOpportunity({ sellType: 'Install', annual: 9 });
    const rows = await queryPipelineByDimension(mine, 'sellType');
    expect(rows.map((r) => [r.label, r.value])).toEqual([['Install', 9], ['New', 5]]);
  });

  it('keeps non-euro deals out of the value and counts them per group', async () => {
    addOpportunity({ stage: 'Qualify', annual: 10 });
    addOpportunity({ stage: 'Qualify', annual: 5000, currency: 'USD' });
    expect(await queryPipelineByStage(mine)).toEqual([{ label: 'Qualify', count: 1, value: 10, excludedNonEur: 1 }]);
  });
});

describe('queryForecastByMonth', () => {
  it('puts an already-passed expected close into the overdue bucket, not a past month', async () => {
    addOpportunity({ annual: 100, expiration: '2026-08-31' });
    addOpportunity({ annual: 50, expiration: '2026-10-01' }); // earlier this month, already passed
    const r = await queryForecastByMonth(mine);
    expect(r.buckets).toEqual([{ month: 'overdue', value: 150 }]);
  });

  it('buckets future closes by month in order and keeps today in the current month', async () => {
    addOpportunity({ annual: 5, expiration: '2026-12-15' });
    addOpportunity({ annual: 7, expiration: '2026-10-16' });
    addOpportunity({ annual: 11, expiration: '2026-10-28 00:00:00' });
    addOpportunity({ annual: 2, expiration: '2026-09-01' });
    const r = await queryForecastByMonth(mine);
    expect(r.buckets).toEqual([
      { month: 'overdue', value: 2 },
      { month: '2026-10', value: 18 },
      { month: '2026-12', value: 5 },
    ]);
  });

  it('reports deals with no expected close separately so the forecast reconciles', async () => {
    addOpportunity({ annual: 100, expiration: '2026-11-05' });
    addOpportunity({ annual: 30, expiration: null });
    addOpportunity({ annual: 20, expiration: '' });
    const r = await queryForecastByMonth(mine);
    expect(r.buckets).toEqual([{ month: '2026-11', value: 100 }]);
    expect(r.noCloseDateCount).toBe(2);
    expect(r.noCloseDateValue).toBe(50);
    const total = r.buckets.reduce((t, b) => t + b.value, 0) + r.noCloseDateValue;
    expect(total).toBe((await queryOpenPipeline(mine)).value);
  });

  it('excludes non-euro deals and closed deals', async () => {
    addOpportunity({ annual: 100, expiration: '2026-11-05' });
    addOpportunity({ annual: 900, expiration: '2026-11-05', currency: 'USD' });
    addOpportunity({ annual: 900, expiration: '2026-11-05', status: 'Won' });
    const r = await queryForecastByMonth(mine);
    expect(r.buckets).toEqual([{ month: '2026-11', value: 100 }]);
    expect(r.excludedNonEur).toBe(1);
  });
});

describe('queryQuietDeals', () => {
  it('lists open deals with no activity inside the idle window, oldest first, valued by ARR', async () => {
    addCustomer('b', 'u1', 'BE');
    addCustomer('c', 'u1', 'BE');
    const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
    addActivity('a', daysAgo(107));
    addActivity('b', daysAgo(6)); // active
    addActivity('c', daysAgo(45));
    const quietOld = addOpportunity({ customerId: 'a', annual: 5000, estimated: null, updatedAt: '2026-10-15 00:00:00' });
    addOpportunity({ customerId: 'b', annual: 1 });
    const quietNew = addOpportunity({ customerId: 'c', annual: null, estimated: 700 });
    addOpportunity({ customerId: 'a', annual: 1, status: 'Won' });
    const r = await queryQuietDeals(mine, 30, 10);
    expect(r.map((d) => d.id)).toEqual([quietOld, quietNew]);
    expect(r.map((d) => d.value)).toEqual([5000, 700]);
    expect(r[0]).toMatchObject({ customerName: 'Customer a', daysStale: 107, currency: 'EUR' });
  });

  it('lists a deal on a never-contacted account with a null last contact, ignoring the deal update time', async () => {
    const id = addOpportunity({ annual: 1, updatedAt: '2026-10-15 00:00:00' });
    const r = await queryQuietDeals(mine, 30, 5);
    expect(r.map((d) => d.id)).toEqual([id]);
    expect(r[0]).toMatchObject({ lastActivityAt: null, daysStale: null });
  });

  it('puts never-contacted deals first and honours the limit', async () => {
    addCustomer('b', 'u1', 'BE');
    addActivity('b', new Date(Date.now() - 50 * 86400000).toISOString());
    addOpportunity({ customerId: 'b', annual: 2 });
    addOpportunity({ customerId: 'a', annual: 1 });
    expect((await queryQuietDeals(mine, 30, 1)).map((d) => d.value)).toEqual([1]);
    expect(await queryQuietDeals(mine, 30, 5)).toHaveLength(2);
  });

  it('does not treat a future-dated activity as recent contact', async () => {
    addActivity('a', new Date(Date.now() - 60 * 86400000).toISOString());
    addActivity('a', new Date(Date.now() + 5 * 86400000).toISOString());
    addOpportunity({ customerId: 'a', annual: 1 });
    expect((await queryQuietDeals(mine, 30, 5))[0]?.daysStale).toBe(60);
  });

  it('agrees with the coverage buckets on the day boundary', async () => {
    addCustomer('b', 'u1', 'BE');
    addCustomer('c', 'u1', 'BE');
    addActivity('b', new Date(Date.now() - 30 * 86400000 - 3600000).toISOString()); // 30 days: still covered
    addActivity('c', new Date(Date.now() - 31 * 86400000).toISOString()); // 31 days: quiet
    addOpportunity({ customerId: 'b', annual: 1 });
    const quiet = addOpportunity({ customerId: 'c', annual: 2 });
    addActivity('a', new Date().toISOString());
    expect((await queryQuietDeals(mine, 30, 5)).map((d) => d.id)).toEqual([quiet]);
  });

  it('scopes to the team region', async () => {
    addCustomer('us', 'u1', 'US');
    addOpportunity({ customerId: 'a', annual: 1 });
    addOpportunity({ customerId: 'us', annual: 2 });
    expect((await queryQuietDeals(team, 30, 10)).map((d) => d.value)).toEqual([1]);
  });
});
