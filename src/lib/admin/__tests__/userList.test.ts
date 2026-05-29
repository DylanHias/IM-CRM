import { describe, it, expect } from 'vitest';
import { dedupeUsersByEmail, isAdminUser } from '@/lib/admin/userList';
import type { CrmUser } from '@/types/admin';

function makeUser(overrides: Partial<CrmUser> = {}): CrmUser {
  return {
    id: 'id-1',
    email: 'someone@ingrammicro.com',
    name: 'Some One',
    role: 'user',
    businessUnit: null,
    title: null,
    lastActiveAt: '2026-05-29T00:00:00.000Z',
    profilePhoto: null,
    analyticsTracked: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('isAdminUser', () => {
  it('flags users in the hardcoded admin email list', () => {
    expect(isAdminUser(makeUser({ email: 'dylan.hias@ingrammicro.com' }))).toBe(true);
  });

  it('is case-insensitive for the hardcoded list', () => {
    expect(isAdminUser(makeUser({ email: 'Dylan.Hias@ingrammicro.com' }))).toBe(true);
  });

  it('flags users with the admin role even when not hardcoded', () => {
    expect(isAdminUser(makeUser({ email: 'lead@ingrammicro.com', role: 'admin' }))).toBe(true);
  });

  it('returns false for regular users', () => {
    expect(isAdminUser(makeUser({ email: 'regular@ingrammicro.com', role: 'user' }))).toBe(false);
  });
});

describe('dedupeUsersByEmail', () => {
  it('keeps the more complete row when an email appears twice', () => {
    const sparse = makeUser({ id: 'msal', name: 'Hias, Dylan', email: 'Dylan.Hias@ingrammicro.com', title: null, analyticsTracked: false });
    const complete = makeUser({ id: 'd365', name: 'Dylan Hias', email: 'dylan.hias@ingrammicro.com', title: 'Technical Account Manager', businessUnit: 'Cloud', analyticsTracked: true });

    const result = dedupeUsersByEmail([sparse, complete]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('d365');
    expect(result[0].title).toBe('Technical Account Manager');
  });

  it('preserves the order of first appearance', () => {
    const a = makeUser({ id: 'a', email: 'a@ingrammicro.com' });
    const dupSparse = makeUser({ id: 'b1', email: 'b@ingrammicro.com', title: null });
    const dupComplete = makeUser({ id: 'b2', email: 'b@ingrammicro.com', title: 'Manager' });
    const c = makeUser({ id: 'c', email: 'c@ingrammicro.com' });

    const result = dedupeUsersByEmail([a, dupSparse, dupComplete, c]);

    expect(result.map((u) => u.id)).toEqual(['a', 'b2', 'c']);
  });

  it('keeps every row that has no email', () => {
    const a = makeUser({ id: 'a', email: '' });
    const b = makeUser({ id: 'b', email: '' });

    const result = dedupeUsersByEmail([a, b]);

    expect(result).toHaveLength(2);
  });
});
