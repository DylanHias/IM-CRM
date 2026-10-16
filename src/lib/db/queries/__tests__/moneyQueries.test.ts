import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/db/client', async () => ({ getDb: (await import('./../reports/__tests__/sqliteFixture')).fixtureGetDb }));

import { queryPipelineData } from '@/lib/db/queries/analytics';
import { queryTeamLeaderboard } from '@/lib/db/queries/teamAnalytics';
import { searchOpportunities, searchRevenue, getAccountSummary } from '@/lib/db/queries/aiSearch';
import { resetFixture, execFixture, addCustomer, addOpportunity, addRevenue } from '../reports/__tests__/sqliteFixture';

beforeEach(() => {
  resetFixture();
  addCustomer('a', 'u1', 'BE');
  execFixture(`ALTER TABLE opportunities ADD COLUMN multi_vendor_opportunity INTEGER`);
});
afterEach(() => vi.useRealTimers());

describe('queryPipelineData', () => {
  it('values open deals by annual revenue in every section, falling back to estimated revenue', async () => {
    addOpportunity({ annual: 1000, estimated: 999999, probability: 50, vendor: 'V', sellType: 'New', stage: 'S', expiration: '2026-03-01' });
    addOpportunity({ annual: null, estimated: 3000, probability: 100, vendor: 'V', sellType: 'New', stage: 'S', expiration: '2026-03-15' });
    addOpportunity({ annual: 7777, status: 'Won', vendor: 'V', sellType: 'New', stage: 'S' });
    const p = await queryPipelineData();
    expect(p.kpis.openValue).toBe(4000);
    expect(p.kpis.weightedForecast).toBe(3500);
    expect(p.forecast).toEqual([{ month: '2026-03', weighted: 3500, total: 4000 }]);
    expect(p.bySellType[0]).toMatchObject({ totalRevenue: 4000, avgRevenue: 2000 });
    expect(p.byVendor[0].avgRevenue).toBe(2000);
    expect(p.stageFunnel[0].totalRevenue).toBe(4000);
  });

  it('reports the annual value on expiring deals', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 16));
    addOpportunity({ annual: 1000, estimated: 5, expiration: '2026-10-20' });
    expect((await queryPipelineData()).expiring[0].estimatedRevenue).toBe(1000);
  });
});

describe('queryTeamLeaderboard', () => {
  it('sums created and won value by annual revenue', async () => {
    execFixture(`CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT, email TEXT, title TEXT, profile_photo TEXT, analytics_tracked INTEGER)`);
    execFixture(`INSERT INTO users VALUES ('u1','U','u@x','t',NULL,1)`);
    addOpportunity({ annual: 1000, estimated: 999999, createdAt: '2026-05-10 00:00:00' });
    addOpportunity({ annual: null, estimated: 500, status: 'Won', closeDate: '2026-05-12', createdAt: '2026-05-11 00:00:00' });
    const [row] = await queryTeamLeaderboard({ start: '2026-05-01T00:00:00.000Z', end: '2026-05-31T00:00:00.000Z' } as Parameters<typeof queryTeamLeaderboard>[0]);
    expect(row.oppsCreatedValue).toBe(1500);
    expect(row.oppsWonValue).toBe(500);
  });
});

describe('aiSearch', () => {
  beforeEach(() => {
    execFixture(`ALTER TABLE customers ADD COLUMN bcn TEXT; ALTER TABLE customers ADD COLUMN arr REAL; ALTER TABLE customers ADD COLUMN cloud_customer INTEGER;
      ALTER TABLE customer_revenue ADD COLUMN active_end_customers INTEGER; ALTER TABLE customer_revenue ADD COLUMN as_of_month TEXT;
      CREATE TABLE contacts (id TEXT PRIMARY KEY, customer_id TEXT); ALTER TABLE follow_ups ADD COLUMN title TEXT;`);
  });

  it('searchOpportunities returns the annual value, largest first', async () => {
    addOpportunity({ annual: 1000, estimated: 5 });
    addOpportunity({ annual: null, estimated: 3000 });
    const rows = await searchOpportunities('Customer');
    expect(rows.map((r) => r.estimated_revenue)).toEqual([3000, 1000]);
  });

  it('getAccountSummary totals open value and ranks top deals by annual revenue', async () => {
    addOpportunity({ annual: 1000, estimated: 999999 });
    addOpportunity({ annual: null, estimated: 3000 });
    addOpportunity({ annual: 50, status: 'Won' });
    const s = await getAccountSummary('a');
    expect(s.oppOpenValue).toBe(4000);
    expect(s.topOpps.map((o) => o.estimated_revenue)).toEqual([3000, 1000, 50]);
  });

  it('searchRevenue returns one row per customer however many reseller rows exist', async () => {
    addRevenue('bcn1', 'a', 10);
    addRevenue('bcn1', 'a', 20);
    addRevenue('bcn1', 'a', 30);
    execFixture(`UPDATE customer_revenue SET active_end_customers = 2, as_of_month = '2026-09-01'`);
    const rows = await searchRevenue('Customer');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ active_end_customers: 6, as_of_month: '2026-09-01' });
  });
});
