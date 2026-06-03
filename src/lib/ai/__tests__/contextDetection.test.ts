import { describe, it, expect } from 'vitest';
import { extractTerms, CUSTOMER_PATTERNS } from '../contextDetection';

describe('extractTerms (customer patterns)', () => {
  it('extracts the company from "information on X" phrasing', () => {
    expect(extractTerms('provide me information on Dattico', CUSTOMER_PATTERNS)).toContain('Dattico');
    expect(extractTerms('give me information on dattico', CUSTOMER_PATTERNS)).toContain('dattico');
  });

  it('extracts the company from "info/details/data on|about|for X"', () => {
    expect(extractTerms('info about Acme', CUSTOMER_PATTERNS)).toContain('Acme');
    expect(extractTerms('details for Globex', CUSTOMER_PATTERNS)).toContain('Globex');
    expect(extractTerms('data on Initech', CUSTOMER_PATTERNS)).toContain('Initech');
  });

  it('still extracts from customer/company/account/about phrasing', () => {
    expect(extractTerms('tell me about Acme', CUSTOMER_PATTERNS)).toContain('Acme');
    expect(extractTerms('customer Globex', CUSTOMER_PATTERNS)).toContain('Globex');
    expect(extractTerms('the account Initech', CUSTOMER_PATTERNS)).toContain('Initech');
  });

  it('returns nothing when no company reference is present', () => {
    expect(extractTerms('how do I create a follow-up?', CUSTOMER_PATTERNS)).toHaveLength(0);
  });
});
