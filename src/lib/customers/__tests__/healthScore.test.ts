import { describe, it, expect } from 'vitest';
import {
  scoreHealth,
  healthTier,
  healthTierLabel,
  healthTierBadgeVariant,
} from '../healthScore';

const NOW = new Date('2026-04-20T12:00:00.000Z');

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 86400000).toISOString();
}

describe('scoreHealth', () => {
  describe('recency component', () => {
    it('null lastActivityAt → 0', () => {
      const r = scoreHealth({ lastActivityAt: null, openOpportunityCount: 0, activityCountLast90Days: 0, now: NOW });
      expect(r.recency).toBe(0);
    });

    it.each([
      [0, 100],
      [7, 100],
      [8, 85],
      [14, 85],
      [15, 65],
      [30, 65],
      [31, 35],
      [60, 35],
      [61, 15],
      [90, 15],
      [91, 0],
      [365, 0],
    ])('days=%i → recency=%i', (days, expected) => {
      const r = scoreHealth({
        lastActivityAt: daysAgo(days),
        openOpportunityCount: 0,
        activityCountLast90Days: 0,
        now: NOW,
      });
      expect(r.recency).toBe(expected);
    });
  });

  describe('pipeline component', () => {
    it.each([
      [0, 10],
      [1, 55],
      [2, 75],
      [3, 90],
      [4, 100],
      [25, 100],
    ])('openOpps=%i → pipeline=%i', (opps, expected) => {
      const r = scoreHealth({
        lastActivityAt: null,
        openOpportunityCount: opps,
        activityCountLast90Days: 0,
        now: NOW,
      });
      expect(r.pipeline).toBe(expected);
    });

    it('negative open opps treated as zero', () => {
      const r = scoreHealth({ lastActivityAt: null, openOpportunityCount: -5, activityCountLast90Days: 0, now: NOW });
      expect(r.pipeline).toBe(10);
    });
  });

  describe('frequency component', () => {
    it.each([
      [0, 0],
      [1, 40],
      [2, 40],
      [3, 70],
      [5, 70],
      [6, 90],
      [9, 90],
      [10, 100],
      [50, 100],
    ])('activity90d=%i → frequency=%i', (acts, expected) => {
      const r = scoreHealth({
        lastActivityAt: null,
        openOpportunityCount: 0,
        activityCountLast90Days: acts,
        now: NOW,
      });
      expect(r.frequency).toBe(expected);
    });
  });

  describe('total (weighted sum)', () => {
    it('totally cold account → low score', () => {
      const r = scoreHealth({ lastActivityAt: null, openOpportunityCount: 0, activityCountLast90Days: 0, now: NOW });
      expect(r.total).toBe(3);
      expect(healthTier(r.total)).toBe('critical');
    });

    it('freshly engaged account with pipeline → high score', () => {
      const r = scoreHealth({
        lastActivityAt: daysAgo(2),
        openOpportunityCount: 3,
        activityCountLast90Days: 10,
        now: NOW,
      });
      expect(r.total).toBe(Math.round(0.4 * 100 + 0.3 * 90 + 0.3 * 100));
      expect(healthTier(r.total)).toBe('healthy');
    });

    it('medium engagement → at risk', () => {
      const r = scoreHealth({
        lastActivityAt: daysAgo(45),
        openOpportunityCount: 1,
        activityCountLast90Days: 2,
        now: NOW,
      });
      expect(r.total).toBe(Math.round(0.4 * 35 + 0.3 * 55 + 0.3 * 40));
      expect(healthTier(r.total)).toBe('atRisk');
    });

    it('future lastActivityAt treated as 0 recency', () => {
      const r = scoreHealth({
        lastActivityAt: daysAgo(-5),
        openOpportunityCount: 0,
        activityCountLast90Days: 0,
        now: NOW,
      });
      expect(r.recency).toBe(0);
    });
  });
});

describe('healthTier', () => {
  it.each([
    [null, 'critical'],
    [undefined, 'critical'],
    [0, 'critical'],
    [39, 'critical'],
    [40, 'atRisk'],
    [69, 'atRisk'],
    [70, 'healthy'],
    [100, 'healthy'],
  ] as const)('score=%s → %s', (score, expected) => {
    expect(healthTier(score)).toBe(expected);
  });
});

describe('healthTierLabel / variant', () => {
  it('produces readable labels and correct badge variants', () => {
    expect(healthTierLabel('healthy')).toBe('Healthy');
    expect(healthTierLabel('atRisk')).toBe('At risk');
    expect(healthTierLabel('critical')).toBe('Critical');
    expect(healthTierBadgeVariant('healthy')).toBe('success');
    expect(healthTierBadgeVariant('atRisk')).toBe('warning');
    expect(healthTierBadgeVariant('critical')).toBe('destructive');
  });
});
