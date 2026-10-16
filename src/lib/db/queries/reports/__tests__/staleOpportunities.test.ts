import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/db/client', async () => ({ getDb: (await import('./sqliteFixture')).fixtureGetDb }));

import { queryMyStaleOpportunities } from '@/lib/db/queries/opportunities';
import { resetFixture, addCustomer, addOpportunity, addActivity } from './sqliteFixture';

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

beforeEach(() => {
  resetFixture();
  addCustomer('a', 'u1', 'BE');
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 16));
});
afterEach(() => vi.useRealTimers());

describe('queryMyStaleOpportunities', () => {
  it('measures staleness from the latest past activity, not from future-dated ones', async () => {
    addActivity('a', daysAgo(60));
    addActivity('a', daysAgo(-5));
    addOpportunity({ customerId: 'a' });
    const [d] = await queryMyStaleOpportunities('u1', null);
    expect(d.daysStale).toBe(60);
  });

  it('reports a never-contacted account as null rather than falling back to the deal update time', async () => {
    addOpportunity({ customerId: 'a', updatedAt: '2026-10-15 00:00:00' });
    const [d] = await queryMyStaleOpportunities('u1', null);
    expect(d).toMatchObject({ lastActivityAt: null, daysStale: null });
  });

  it('leaves out deals whose account was contacted within the window', async () => {
    addActivity('a', daysAgo(30));
    addOpportunity({ customerId: 'a' });
    expect(await queryMyStaleOpportunities('u1', null)).toHaveLength(0);
  });

  it('ranks never-contacted deals by age since creation, under the limit', async () => {
    addCustomer('b', 'u1', 'BE');
    addActivity('b', daysAgo(50));
    const stale50 = addOpportunity({ customerId: 'b' });
    const old400 = addOpportunity({ customerId: 'a', createdAt: daysAgo(400) });
    addCustomer('c', 'u1', 'BE');
    addOpportunity({ customerId: 'c', createdAt: daysAgo(0) });
    expect((await queryMyStaleOpportunities('u1', null, 30, 2)).map((d) => d.id)).toEqual([old400, stale50]);
  });
});
