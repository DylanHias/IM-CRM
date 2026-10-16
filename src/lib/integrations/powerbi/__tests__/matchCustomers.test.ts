import { describe, it, expect } from 'vitest';
import {
  buildMatchIndex,
  resolveCustomerId,
  type MatchableCustomer,
  type PowerBiRevenueRow,
} from '../matchCustomers';

function customer(id: string, over: Partial<MatchableCustomer> = {}): MatchableCustomer {
  return { id, name: `Customer ${id}`, bcn: null, accountNumber: null, resellerId: null, armId: null, ...over };
}

function row(over: Partial<PowerBiRevenueRow> = {}): PowerBiRevenueRow {
  return { bcn: null, resellerAccount: null, resellerId: null, marketplaceId: null, resellerName: null, ...over };
}

describe('resolveCustomerId', () => {
  it('matches on bcn first, ahead of account number', () => {
    const index = buildMatchIndex([
      customer('a', { bcn: 'B1' }),
      customer('b', { accountNumber: 'ACC1' }),
    ]);
    expect(resolveCustomerId(row({ bcn: 'B1', resellerAccount: 'ACC1' }), index)).toBe('a');
  });

  it('falls back through account number, reseller id, marketplace id and unique name', () => {
    const index = buildMatchIndex([
      customer('acc', { accountNumber: 'ACC1' }),
      customer('res', { resellerId: 'R1' }),
      customer('mkt', { armId: "'M1'" }),
      customer('nam', { name: 'Acme N.V.' }),
    ]);
    expect(resolveCustomerId(row({ bcn: 'NOPE', resellerAccount: 'ACC1' }), index)).toBe('acc');
    expect(resolveCustomerId(row({ resellerId: 'R1' }), index)).toBe('res');
    expect(resolveCustomerId(row({ marketplaceId: 'M1' }), index)).toBe('mkt');
    expect(resolveCustomerId(row({ resellerName: 'ACME nv' }), index)).toBe('nam');
  });

  it('does not match on a name shared by two customers', () => {
    const index = buildMatchIndex([
      customer('a', { name: 'Acme' }),
      customer('b', { name: 'ACME' }),
    ]);
    expect(resolveCustomerId(row({ resellerName: 'Acme' }), index)).toBeNull();
  });

  it('returns null when no key matches', () => {
    expect(resolveCustomerId(row({ bcn: 'ZZZ' }), buildMatchIndex([]))).toBeNull();
  });

  it('resolves rows carrying different keys to the same customer, so they can be summed', () => {
    const index = buildMatchIndex([customer('a', { bcn: 'B1', resellerId: 'R2' })]);
    expect(resolveCustomerId(row({ bcn: 'B1' }), index)).toBe('a');
    expect(resolveCustomerId(row({ bcn: 'OTHER', resellerId: 'R2' }), index)).toBe('a');
  });
});
