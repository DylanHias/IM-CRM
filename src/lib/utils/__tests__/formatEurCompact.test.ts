import { describe, expect, it } from 'vitest';
import { formatEurCompact } from '../currencyUtils';

describe('formatEurCompact', () => {
  it('compacts positives', () => {
    expect(formatEurCompact(1_200_000)).toBe('€1.20M');
    expect(formatEurCompact(125_000)).toBe('€125K');
    expect(formatEurCompact(999)).toBe('€999');
  });

  it('keeps the sign on negatives, including axis ticks', () => {
    expect(formatEurCompact(-125_000)).toBe('−€125K');
    expect(formatEurCompact(-1_500_000)).toBe('−€1.50M');
  });

  it('never prints a signed zero', () => {
    expect(formatEurCompact(-0.2)).toBe('€0');
    expect(formatEurCompact(0)).toBe('€0');
  });
});
