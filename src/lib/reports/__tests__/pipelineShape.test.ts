import { describe, expect, it } from 'vitest';
import { forecastSeries, topDimensionsWithOther, topWithOther } from '../pipelineShape';

describe('forecastSeries', () => {
  it('pulls overdue out as its own bucket and zero-fills the gaps between forward months', () => {
    const r = forecastSeries([
      { month: 'overdue', value: 500 },
      { month: '2026-11', value: 100 },
      { month: '2027-02', value: 300 },
    ]);
    expect(r.overdue).toBe(500);
    expect(r.months).toEqual([
      { month: '2026-11', value: 100 },
      { month: '2026-12', value: 0 },
      { month: '2027-01', value: 0 },
      { month: '2027-02', value: 300 },
    ]);
  });

  it('reports no overdue and no months for an empty forecast', () => {
    expect(forecastSeries([])).toEqual({ overdue: null, months: [] });
  });

  it('keeps overdue even when it is the only bucket', () => {
    expect(forecastSeries([{ month: 'overdue', value: 5 }])).toEqual({ overdue: 5, months: [] });
  });
});

describe('topWithOther', () => {
  const rows = ['a', 'b', 'c', 'd'].map((label, i) => ({ label, value: 40 - i * 10, count: 1, excludedNonEur: 0 }));

  it('keeps everything when it fits', () => {
    expect(topWithOther(rows, 4)).toEqual(rows);
  });

  it('folds the tail into Other so the bars still add up', () => {
    const r = topWithOther(rows, 3);
    expect(r.map((x) => x.label)).toEqual(['a', 'b', 'Other']);
    expect(r[2]).toMatchObject({ value: 30, count: 2 });
  });

  it('folds a group genuinely named Other into the roll-up instead of emitting two Other rows', () => {
    const withOther = [
      { label: 'a', value: 40, count: 1, excludedNonEur: 0 },
      { label: 'Other', value: 30, count: 1, excludedNonEur: 0 },
      { label: 'c', value: 20, count: 1, excludedNonEur: 0 },
      { label: 'd', value: 10, count: 1, excludedNonEur: 0 },
    ];
    const r = topWithOther(withOther, 3);
    expect(r.map((x) => x.label)).toEqual(['a', 'c', 'Other']);
    expect(r[2]).toMatchObject({ value: 40, count: 2 });
  });
});

describe('topDimensionsWithOther', () => {
  const rows = ['a', 'b', 'c', 'd'].map((label, i) => ({ label, arr: 40 - i * 10, accounts: 2, matched: 1 }));

  it('keeps everything when it fits', () => {
    expect(topDimensionsWithOther(rows, 4)).toEqual(rows);
  });

  it('folds the tail into Other so the bars still add up', () => {
    const r = topDimensionsWithOther(rows, 3);
    expect(r.map((x) => x.label)).toEqual(['a', 'b', 'Other']);
    expect(r[2]).toMatchObject({ arr: 30, accounts: 4, matched: 2 });
  });

  it('folds a dimension genuinely named Other into the roll-up', () => {
    const withOther = [
      { label: 'a', arr: 40, accounts: 1, matched: 1 },
      { label: 'Other', arr: 30, accounts: 1, matched: 1 },
      { label: 'c', arr: 20, accounts: 1, matched: 1 },
      { label: 'd', arr: 10, accounts: 1, matched: 0 },
    ];
    const r = topDimensionsWithOther(withOther, 3);
    expect(r.map((x) => x.label)).toEqual(['a', 'c', 'Other']);
    expect(r[2]).toMatchObject({ arr: 40, accounts: 2, matched: 1 });
  });
});
