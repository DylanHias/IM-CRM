import { describe, it, expect } from 'vitest';
import { rankHelpSections } from '../helpRanking';

const sections = [
  { title: 'A', keywords: ['apple', 'fruit'], content: 'AAA' },
  { title: 'B', keywords: ['banana'], content: 'BBB' },
  { title: 'C', keywords: ['cherry', 'fruit', 'red'], content: 'CCC' },
  { title: 'D', keywords: ['date'], content: 'DDD' },
];

describe('rankHelpSections', () => {
  it('ranks the section with the most keyword matches first (B11)', () => {
    const out = rankHelpSections(sections, 'cherry fruit', 3, 9999);
    expect(out[0].title).toBe('C');
  });

  it('caps the number of sections', () => {
    const out = rankHelpSections(sections, 'apple banana cherry date fruit', 2, 9999);
    expect(out).toHaveLength(2);
  });

  it('stops before exceeding the char budget but always returns at least one', () => {
    const out = rankHelpSections(sections, 'apple cherry fruit', 3, 4);
    expect(out).toHaveLength(1);
  });

  it('falls back to the first two sections when nothing matches', () => {
    const out = rankHelpSections(sections, 'zzz qqq', 3, 9999);
    expect(out.map((s) => s.title)).toEqual(['A', 'B']);
  });
});
