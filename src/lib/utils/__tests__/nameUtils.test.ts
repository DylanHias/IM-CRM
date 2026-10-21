import { describe, expect, it } from 'vitest';
import { formatDisplayName, firstNameOf } from '@/lib/utils/nameUtils';

describe('formatDisplayName', () => {
  it('flips the "Last, First" form Azure AD returns', () => {
    expect(formatDisplayName('Hias, Dylan')).toBe('Dylan Hias');
  });

  it('leaves an already-natural name alone', () => {
    expect(formatDisplayName('Dylan Hias')).toBe('Dylan Hias');
  });
});

describe('firstNameOf', () => {
  it('takes the given name from "Last, First", not the surname', () => {
    expect(firstNameOf('Hias, Dylan', 'friend')).toBe('Dylan');
  });

  it('takes the given name from a natural name', () => {
    expect(firstNameOf('Dylan Hias', 'friend')).toBe('Dylan');
  });

  it('handles a single-word name', () => {
    expect(firstNameOf('Dylan', 'friend')).toBe('Dylan');
  });

  it('falls back when the name is missing or blank', () => {
    expect(firstNameOf(null, 'friend')).toBe('friend');
    expect(firstNameOf(undefined, 'friend')).toBe('friend');
    expect(firstNameOf('   ', 'friend')).toBe('friend');
  });
});
