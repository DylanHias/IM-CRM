import { describe, it, expect } from 'vitest';
import { accountScopeSql, dealScopeSql } from '@/lib/reports/scope';

describe('accountScopeSql', () => {
  it('scopes Mine by account owner', () => {
    expect(accountScopeSql({ kind: 'mine', userIds: ['u1'] }, 0).sql).toContain('owner_id IN ($1)');
  });

  it('scopes Team by country, not by owner', () => {
    const { sql, params } = accountScopeSql({ kind: 'team', region: 'BE' }, 0);
    expect(sql).toContain('address_country IN ($1)');
    expect(sql).not.toContain('owner_id');
    expect(params).toEqual(['BE']);
  });

  it('expands Benelux to all three countries and honours the offset', () => {
    const { sql, params } = accountScopeSql({ kind: 'team', region: 'BENELUX' }, 2);
    expect(sql).toContain('address_country IN ($3, $4, $5)');
    expect(params).toEqual(['BE', 'NL', 'LU']);
  });

  it('matches nothing for an empty user list', () => {
    expect(accountScopeSql({ kind: 'mine', userIds: [] }, 0)).toEqual({ sql: '1=0', params: [] });
  });
});

describe('dealScopeSql', () => {
  it('scopes Mine by deal owner', () => {
    const { sql, params } = dealScopeSql({ kind: 'mine', userIds: ['u1', 'u2'] }, 0);
    expect(sql).toContain('created_by_id IN ($1, $2)');
    expect(params).toEqual(['u1', 'u2']);
  });

  it('scopes Team by the account country, not by owner', () => {
    const { sql, params } = dealScopeSql({ kind: 'team', region: 'NL' }, 0);
    expect(sql).toContain('address_country IN ($1)');
    expect(sql).not.toContain('created_by_id');
    expect(params).toEqual(['NL']);
  });
});
