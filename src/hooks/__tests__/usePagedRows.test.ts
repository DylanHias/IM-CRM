import { describe, expect, it } from 'vitest';
import { rowsThatFit, clampPage } from '@/hooks/usePagedRows';

describe('rowsThatFit', () => {
  it('counts whole rows that fit the measured height', () => {
    expect(rowsThatFit(440, 44)).toBe(10);
    expect(rowsThatFit(450, 44)).toBe(10);
  });

  it('always leaves room for one row, even in a collapsed panel', () => {
    expect(rowsThatFit(0, 44)).toBe(1);
    expect(rowsThatFit(20, 44)).toBe(1);
  });
});

describe('clampPage', () => {
  it('keeps a page inside the available range', () => {
    expect(clampPage(2, 25, 10)).toBe(2);
    expect(clampPage(9, 25, 10)).toBe(3);
    expect(clampPage(0, 25, 10)).toBe(1);
  });

  it('falls back to page one when there is nothing to show', () => {
    expect(clampPage(4, 0, 10)).toBe(1);
  });

  it('pulls the page back when the panel grows and fits everything', () => {
    expect(clampPage(3, 12, 20)).toBe(1);
  });
});
