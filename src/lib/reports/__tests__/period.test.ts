import { describe, it, expect } from 'vitest';
import { periodRange, availablePeriods, monthKeys } from '../period';

const NOW = new Date('2026-10-16T12:00:00Z');

describe('report period', () => {
  it('a rolling period ends at the last complete month', () => {
    expect(periodRange({ kind: 'rolling', months: 3 }, NOW))
      .toEqual({ from: '2026-07-01', to: '2026-09-30' });
  });

  it('rolling 12 months spans a full year of complete months', () => {
    expect(periodRange({ kind: 'rolling', months: 12 }, NOW))
      .toEqual({ from: '2025-10-01', to: '2026-09-30' });
  });

  it('a quarter range covers its three months', () => {
    expect(periodRange({ kind: 'quarter', year: 2026, quarter: 2 }, NOW))
      .toEqual({ from: '2026-04-01', to: '2026-06-30' });
  });

  it('offers only complete quarters inside the last 12 months', () => {
    const quarters = availablePeriods(NOW).filter((p) => p.kind === 'quarter');
    expect(quarters).toEqual([
      { kind: 'quarter', year: 2026, quarter: 3 },
      { kind: 'quarter', year: 2026, quarter: 2 },
      { kind: 'quarter', year: 2026, quarter: 1 },
      { kind: 'quarter', year: 2025, quarter: 4 },
    ]);
  });

  it('never offers a period beyond the 12-month Power BI window', () => {
    const froms = availablePeriods(NOW).map((p) => periodRange(p, NOW).from);
    expect(froms.every((f) => f >= '2025-10-01')).toBe(true);
  });

  it('lists month keys without the partial current month', () => {
    expect(monthKeys({ kind: 'rolling', months: 3 }, NOW)).toEqual(['2026-07', '2026-08', '2026-09']);
  });
});
