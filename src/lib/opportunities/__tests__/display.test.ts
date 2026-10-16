import { describe, expect, it } from 'vitest';
import { relativeExpiration, weightedValue, oppArr } from '../display';
import { createOpportunity } from '@/__tests__/mocks/factories';

const TODAY = new Date(2026, 9, 14);

describe('relativeExpiration', () => {
  it('labels past, current and upcoming expiry dates', () => {
    expect(relativeExpiration('2026-10-10', TODAY)).toEqual({ label: '4d overdue', tone: 'overdue' });
    expect(relativeExpiration('2026-10-14', TODAY)).toEqual({ label: 'today', tone: 'soon' });
    expect(relativeExpiration('2026-10-19', TODAY)).toEqual({ label: 'in 5d', tone: 'soon' });
    expect(relativeExpiration('2026-11-01', TODAY)).toEqual({ label: 'in 18d', tone: 'near' });
    expect(relativeExpiration('2027-01-01', TODAY)).toEqual({ label: 'in 79d', tone: 'neutral' });
  });

  it('returns null for missing or invalid dates', () => {
    expect(relativeExpiration(null, TODAY)).toBeNull();
    expect(relativeExpiration('nope', TODAY)).toBeNull();
  });
});

describe('weightedValue', () => {
  it('multiplies revenue by probability', () => {
    expect(weightedValue(createOpportunity({ estimatedRevenue: 100000, probability: 40 }))).toBe(40000);
    expect(weightedValue(createOpportunity({ estimatedRevenue: null, probability: 40 }))).toBe(0);
  });
});

describe('oppArr', () => {
  it('prefers annual revenue as the ARR', () => {
    expect(oppArr({ annualRevenue: 120000, estimatedRevenue: 9000 })).toBe(120000);
  });

  it('falls back to estimated revenue when annual revenue is missing', () => {
    expect(oppArr({ annualRevenue: null, estimatedRevenue: 9000 })).toBe(9000);
  });

  it('is null only when both are missing', () => {
    expect(oppArr({ annualRevenue: null, estimatedRevenue: null })).toBeNull();
  });
});

describe('weightedValue', () => {
  it('weights ARR by probability', () => {
    expect(weightedValue(createOpportunity({ annualRevenue: 200000, estimatedRevenue: 0, probability: 25 }))).toBe(50000);
  });
});
