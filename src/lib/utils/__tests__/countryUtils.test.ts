import { describe, it, expect } from 'vitest';
import { getCountryCode } from '../countryUtils';

describe('countryUtils', () => {
  describe('getCountryCode', () => {
    it('returns BE for Belgium', () => {
      expect(getCountryCode('Belgium')).toBe('BE');
    });

    it('returns NL for Netherlands', () => {
      expect(getCountryCode('Netherlands')).toBe('NL');
    });

    it('returns LU for Luxembourg', () => {
      expect(getCountryCode('Luxembourg')).toBe('LU');
    });

    it('returns correct codes for all mapped countries', () => {
      const expected: Record<string, string> = {
        Belgium: 'BE', Netherlands: 'NL', Luxembourg: 'LU', France: 'FR',
        Germany: 'DE', 'United Kingdom': 'GB', 'United States': 'US',
        Spain: 'ES', Italy: 'IT', Portugal: 'PT', Austria: 'AT',
        Switzerland: 'CH', Ireland: 'IE', Denmark: 'DK', Sweden: 'SE',
        Norway: 'NO', Finland: 'FI', Poland: 'PL', 'Czech Republic': 'CZ',
      };

      for (const [country, code] of Object.entries(expected)) {
        expect(getCountryCode(country)).toBe(code);
      }
    });

    it('returns BE for unknown country', () => {
      expect(getCountryCode('Atlantis')).toBe('BE');
    });

    it('returns BE for null', () => {
      expect(getCountryCode(null)).toBe('BE');
    });

    it('returns BE for empty string', () => {
      expect(getCountryCode('')).toBe('BE');
    });

    it('is case sensitive', () => {
      expect(getCountryCode('belgium')).toBe('BE'); // not in map, defaults to BE
    });
  });
});
