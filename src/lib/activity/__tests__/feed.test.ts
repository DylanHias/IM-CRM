import { describe, expect, it } from 'vitest';
import { buildFeed, dayLabel, groupByDay, eventDate, matchesFeedQuery } from '../feed';
import { createActivity, createFollowUp, createOpportunity } from '@/__tests__/mocks/factories';

const TODAY = new Date(2026, 9, 14, 15, 0);

describe('buildFeed', () => {
  it('merges activities, follow-ups and opportunities newest first', () => {
    const feed = buildFeed(
      [createActivity({ id: 'a', occurredAt: '2026-10-13T09:00:00.000Z' })],
      [createFollowUp({ id: 'f', dueDate: '2026-10-14' })],
      [createOpportunity({ id: 'o', expirationDate: null, createdAt: '2026-10-01T09:00:00.000Z' })],
    );
    expect(feed.map((e) => `${e.kind}:${e.id}`)).toEqual(['followup:f', 'activity:a', 'opportunity:o']);
  });

  it('dates opportunities by expiry, falling back to creation', () => {
    expect(eventDate({ kind: 'opportunity', ...createOpportunity({ expirationDate: '2026-12-01', createdAt: '2026-01-01T00:00:00Z' }) })).toBe('2026-12-01');
  });
});

describe('dayLabel', () => {
  it('names today and yesterday, otherwise shows the date', () => {
    expect(dayLabel('2026-10-14T08:00:00', TODAY)).toBe('Today');
    expect(dayLabel('2026-10-13', TODAY)).toBe('Yesterday');
    expect(dayLabel('2026-10-02T08:00:00', TODAY)).toBe('Fri 2 Oct');
    expect(dayLabel('2025-12-24', TODAY)).toBe('Wed 24 Dec 2025');
  });
});

describe('groupByDay', () => {
  it('starts a new group whenever the day label changes', () => {
    const feed = buildFeed(
      [
        createActivity({ id: 'a1', occurredAt: '2026-10-14T09:00:00' }),
        createActivity({ id: 'a2', occurredAt: '2026-10-14T07:00:00' }),
        createActivity({ id: 'a3', occurredAt: '2026-10-12T09:00:00' }),
      ],
      [],
      [],
    );
    expect(groupByDay(feed, TODAY).map((g) => [g.label, g.events.map((e) => e.id)])).toEqual([
      ['Today', ['a1', 'a2']],
      ['Mon 12 Oct', ['a3']],
    ]);
  });
});

describe('matchesFeedQuery', () => {
  it('matches subject, title or customer name, case-insensitively', () => {
    const names = new Map([['c1', 'Brabant Logistics NV']]);
    const a = { kind: 'activity' as const, ...createActivity({ subject: 'Renewal call', customerId: 'c1' }) };
    expect(matchesFeedQuery(a, 'renewal', names)).toBe(true);
    expect(matchesFeedQuery(a, 'brabant', names)).toBe(true);
    expect(matchesFeedQuery(a, 'azure', names)).toBe(false);
    expect(matchesFeedQuery(a, '', names)).toBe(true);
  });
});
