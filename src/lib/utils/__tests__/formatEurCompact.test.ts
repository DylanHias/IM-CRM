import { describe, expect, it } from 'vitest';
import { formatEurCompact } from '../currencyUtils';

describe('formatEurCompact', () => {
  it('compacts positives', () => {
    expect(formatEurCompact(1_200_000)).toBe('€1.20M');
    expect(formatEurCompact(125_000)).toBe('€125K');
    expect(formatEurCompact(999)).toBe('€999');
  });

  it('rolls into millions at the rounding boundary instead of printing 1000K', () => {
    expect(formatEurCompact(999_500)).toBe('€1.00M');
    expect(formatEurCompact(999_499)).toBe('€999K');
    expect(formatEurCompact(-999_500)).toBe('−€1.00M');
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
