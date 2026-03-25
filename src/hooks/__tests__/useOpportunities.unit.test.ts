import { describe, it, expect } from 'vitest';
import { stageToProbability } from '../useOpportunities';
import type { OpportunityStage } from '@/types/entities';

describe('stageToProbability', () => {
  const cases: [OpportunityStage, number][] = [
    ['Prospecting', 5],
    ['Validated', 25],
    ['Qualified', 50],
    ['Verbal Received', 75],
    ['Contract Received', 100],
    ['Billing Rejection', 100],
    ['Pending Vendor Confirmation', 100],
    ['Purchased', 100],
  ];

  it.each(cases)('stage "%s" maps to probability %i', (stage, expected) => {
    expect(stageToProbability(stage)).toBe(expected);
  });
});
