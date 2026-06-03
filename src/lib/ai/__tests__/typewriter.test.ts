import { describe, expect, it } from 'vitest';
import { computeReveal } from '@/lib/ai/typewriter';

describe('computeReveal', () => {
  it('reveals nothing when already caught up', () => {
    expect(computeReveal(10, 10, 16, 55, 120)).toBe(10);
    expect(computeReveal(12, 10, 16, 55, 120)).toBe(12);
  });

  it('reveals at the steady cadence when lag is within the cap', () => {
    // lag = 100 (< cap 120): 55 chars/sec over 1000ms ≈ 55 chars
    expect(computeReveal(0, 100, 1000, 55, 120)).toBe(55);
  });

  it('always advances by at least one character when behind', () => {
    expect(computeReveal(0, 5, 1, 55, 120)).toBe(1);
  });

  it('accelerates to catch up when lag exceeds the cap', () => {
    // lag = 500, cap = 120 → burn down to within the cap this tick
    expect(computeReveal(0, 500, 16, 55, 120)).toBe(380);
  });

  it('never overshoots the target', () => {
    expect(computeReveal(195, 200, 1000, 55, 120)).toBe(200);
  });
});
