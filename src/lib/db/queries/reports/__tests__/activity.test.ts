import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/db/client', async () => ({ getDb: (await import('./sqliteFixture')).fixtureGetDb }));

import {
  queryActivityVolume,
  queryAccountsTouched,
  queryFollowUpCompletion,
  queryActivitiesPerWonDeal,
} from '@/lib/db/queries/reports/activity';
import type { ReportPeriod } from '@/lib/reports/period';
import type { ReportScope } from '@/lib/reports/scope';
import { resetFixture, addCustomer, addActivity, addFollowUp, addOpportunity } from './sqliteFixture';

const mine: ReportScope = { kind: 'mine', userIds: ['u1'] };
const team: ReportScope = { kind: 'team', region: 'BENELUX' };
// Fake "now" is 2026-10-16, so a rolling 3-month period is Jul-Sep 2026 and the previous window is Apr-Jun 2026.
const q3: ReportPeriod = { kind: 'rolling', months: 3 };

beforeEach(() => {
  resetFixture();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 16, 13));
});
afterEach(() => vi.useRealTimers());

describe('queryActivityVolume', () => {
  it('counts only the activities the user logged under Mine', async () => {
    addCustomer('a', 'u1', 'BE');
    addActivity('a', '2026-08-05T10:00:00Z', 'u1', 'call');
    addActivity('a', '2026-08-06T10:00:00Z', 'u1', 'meeting');
    addActivity('a', '2026-08-07T10:00:00Z', 'u2', 'call');
    const r = await queryActivityVolume(mine, q3);
    expect(r.total).toBe(2);
    expect(r.byMonth).toEqual([
      { month: '2026-08', type: 'call', count: 1 },
      { month: '2026-08', type: 'meeting', count: 1 },
    ]);
  });

  it('counts every activity on regional accounts under Team, and none elsewhere', async () => {
    addCustomer('a', 'u1', 'BE');
    addCustomer('far', 'u9', 'US');
    addActivity('a', '2026-08-05T10:00:00Z', 'u1');
    addActivity('a', '2026-08-06T10:00:00Z', 'u2');
    addActivity('far', '2026-08-06T10:00:00Z', 'u2');
    expect((await queryActivityVolume(team, q3)).total).toBe(2);
  });

  it('compares against a previous window of equal length and ignores the partial month', async () => {
    addCustomer('a', 'u1', 'BE');
    addActivity('a', '2026-07-10T10:00:00Z');
    addActivity('a', '2026-09-30T20:00:00Z');
    addActivity('a', '2026-04-01T10:00:00Z'); // previous window
    addActivity('a', '2026-06-30T10:00:00Z'); // previous window
    addActivity('a', '2026-03-31T10:00:00Z'); // before it
    addActivity('a', '2026-10-05T10:00:00Z'); // partial current month
    const r = await queryActivityVolume(mine, q3);
    expect(r.total).toBe(2);
    expect(r.previous).toBe(2);
  });

  it('returns zeros for an empty book', async () => {
    expect(await queryActivityVolume(mine, q3)).toEqual({ total: 0, previous: 0, byMonth: [] });
  });
});

describe('queryAccountsTouched', () => {
  it('counts an account as touched by any activity on it, whoever logged it', async () => {
    addCustomer('a', 'u1', 'BE');
    addCustomer('b', 'u1', 'BE');
    addActivity('a', '2026-08-05T10:00:00Z', 'u2');
    expect(await queryAccountsTouched(mine, q3)).toEqual({ touched: 1, owned: 2 });
  });

  it('does not count activity outside the period or on deactivated accounts', async () => {
    addCustomer('a', 'u1', 'BE');
    addCustomer('gone', 'u1', 'BE', { status: 'inactive' });
    addActivity('a', '2026-06-30T10:00:00Z');
    addActivity('a', '2026-10-05T10:00:00Z');
    addActivity('gone', '2026-08-05T10:00:00Z');
    expect(await queryAccountsTouched(mine, q3)).toEqual({ touched: 0, owned: 1 });
  });

  it('counts an account once however many activities it has', async () => {
    addCustomer('a', 'u1', 'BE');
    addActivity('a', '2026-08-05T10:00:00Z');
    addActivity('a', '2026-08-06T10:00:00Z', 'u2');
    expect((await queryAccountsTouched(mine, q3)).touched).toBe(1);
  });
});

describe('queryFollowUpCompletion', () => {
  it('counts follow-ups completed in the period, not created in it', async () => {
    addCustomer('a', 'u1', 'BE');
    addFollowUp({ due: '2026-08-10', completedAt: '2026-08-09T10:00:00Z', createdAt: '2026-01-01 00:00:00' });
    addFollowUp({ due: '2026-08-12', createdAt: '2026-01-01 00:00:00' }); // due in period, never done
    addFollowUp({ due: '2026-11-30', createdAt: '2026-09-15 00:00:00' }); // created in period, not yet due
    addFollowUp({ due: '2026-05-01', completedAt: '2026-05-02T10:00:00Z' }); // completed before the period
    expect(await queryFollowUpCompletion(mine, q3)).toEqual({ completed: 1, total: 2 });
  });

  it('counts a follow-up completed in the period even when it was due earlier', async () => {
    addFollowUp({ due: '2026-05-01', completedAt: '2026-07-02T10:00:00Z' });
    expect(await queryFollowUpCompletion(mine, q3)).toEqual({ completed: 1, total: 1 });
  });

  it('scopes follow-ups by their owner under Mine', async () => {
    addCustomer('a', 'u1', 'BE');
    addFollowUp({ due: '2026-08-10', completedAt: '2026-08-09T10:00:00Z', owner: 'u1' });
    addFollowUp({ due: '2026-08-10', completedAt: '2026-08-09T10:00:00Z', owner: 'u2' });
    addFollowUp({ due: '2026-08-10', owner: 'u2' });
    expect(await queryFollowUpCompletion(mine, q3)).toEqual({ completed: 1, total: 1 });
  });

  it('returns zeros when there are no follow-ups', async () => {
    expect(await queryFollowUpCompletion(mine, q3)).toEqual({ completed: 0, total: 0 });
  });
});

describe('queryActivitiesPerWonDeal', () => {
  it('returns null when nothing was won', async () => {
    addCustomer('a', 'u1', 'BE');
    addActivity('a', '2026-08-05T10:00:00Z');
    addOpportunity({ status: 'Lost', closeDate: '2026-08-10' });
    expect(await queryActivitiesPerWonDeal(mine, q3)).toBeNull();
  });

  it('divides the user activities by the user deals won in the period', async () => {
    addCustomer('a', 'u1', 'BE');
    for (let d = 1; d <= 6; d++) addActivity('a', `2026-08-0${d}T10:00:00Z`);
    addActivity('a', '2026-08-09T10:00:00Z', 'u2'); // not the user's
    addOpportunity({ status: 'Won', closeDate: '2026-08-10' });
    addOpportunity({ status: 'Won', closeDate: '2026-09-10' });
    addOpportunity({ status: 'Won', closeDate: '2026-09-10', owner: 'u2' }); // not the user's
    addOpportunity({ status: 'Won', closeDate: '2026-06-10' }); // outside the period
    expect(await queryActivitiesPerWonDeal(mine, q3)).toBe(3);
  });
});
