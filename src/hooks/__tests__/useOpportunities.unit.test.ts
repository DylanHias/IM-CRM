import { describe, it, expect } from 'vitest';
import { stageToProbability } from '../useOpportunities';
import { D365_ALLOWED_PROBABILITIES, STAGES } from '@/lib/opportunityRules';
import type { OpportunityStage } from '@/types/entities';

describe('stageToProbability', () => {
  const cases: [OpportunityStage, number][] = [
    ['Prospecting', 5],
    ['Validated', 20],
    ['Qualified', 40],
    ['Verbal Received', 80],
    ['Contract Received', 95],
    ['Billing Rejection', 95],
    ['Pending Vendor Confirmation', 95],
    ['Purchased', 95],
  ];

  it.each(cases)('stage "%s" maps to probability %i', (stage, expected) => {
    expect(stageToProbability(stage)).toBe(expected);
  });

  it('every stage maps to a probability D365 accepts', () => {
    for (const stage of STAGES) {
      expect(D365_ALLOWED_PROBABILITIES).toContain(stageToProbability(stage));
    }
  });
});
