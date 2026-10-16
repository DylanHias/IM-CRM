import { describe, expect, it } from 'vitest';
import { summarizeLastDay, pendingBreakdown } from '../historySummary';
import { createSyncRecord } from '@/__tests__/mocks/factories';

const NOW = new Date('2026-10-14T12:00:00.000Z');

describe('summarizeLastDay', () => {
  it('counts finished runs from the last 24 hours only', () => {
    const records = [
      createSyncRecord({ id: 1, status: 'success', startedAt: '2026-10-14T11:00:00.000Z' }),
      createSyncRecord({ id: 2, status: 'success', startedAt: '2026-10-14T10:00:00.000Z' }),
      createSyncRecord({ id: 3, status: 'error', startedAt: '2026-10-14T09:00:00.000Z' }),
      createSyncRecord({ id: 4, status: 'partial', startedAt: '2026-10-14T08:00:00.000Z' }),
      createSyncRecord({ id: 5, status: 'running', startedAt: '2026-10-14T11:59:00.000Z' }),
      createSyncRecord({ id: 6, status: 'error', startedAt: '2026-10-12T11:00:00.000Z' }),
    ];
    expect(summarizeLastDay(records, NOW)).toEqual({ runs: 4, successRate: 50, errors: 1, partial: 1 });
  });

  it('returns no rate when nothing ran', () => {
    expect(summarizeLastDay([], NOW)).toEqual({ runs: 0, successRate: null, errors: 0, partial: 0 });
  });
});

describe('pendingBreakdown', () => {
  it('lists only the kinds that have changes, with singular and plural', () => {
    expect(pendingBreakdown(2, 1, 0)).toBe('2 activities · 1 follow-up');
    expect(pendingBreakdown(1, 0, 3)).toBe('1 activity · 3 opportunities');
  });

  it('says everything is synced when nothing waits', () => {
    expect(pendingBreakdown(0, 0, 0)).toBe('All changes synced');
  });
});
