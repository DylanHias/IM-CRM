import { describe, it, expect, vi, beforeEach } from 'vitest';

const select = vi.fn();
const execute = vi.fn();

vi.mock('@/lib/db/client', () => ({
  getDb: vi.fn(async () => ({ select, execute })),
}));

import { resolveUserDbId, queryD365UserIdByEmail } from '@/lib/db/queries/users';

describe('queryD365UserIdByEmail', () => {
  beforeEach(() => {
    select.mockReset();
    execute.mockReset();
  });

  it('orders by profile-data presence then created_at so a stale MSAL duplicate never wins', async () => {
    select.mockResolvedValueOnce([{ id: 'd365-row-with-birthday' }]);
    await queryD365UserIdByEmail('dylan@ingrammicro.com');
    const sql = select.mock.calls[0][0] as string;
    expect(sql).toContain('ORDER BY');
    expect(sql).toContain('birthday IS NOT NULL');
    expect(sql).toContain('created_at ASC');
  });

  it('returns the resolved row id', async () => {
    select.mockResolvedValueOnce([{ id: 'd365-row-with-birthday' }]);
    const id = await queryD365UserIdByEmail('dylan@ingrammicro.com');
    expect(id).toBe('d365-row-with-birthday');
  });
});

describe('resolveUserDbId', () => {
  beforeEach(() => {
    select.mockReset();
    execute.mockReset();
  });

  it('returns the D365 systemuserid when a row exists for the email', async () => {
    select.mockResolvedValueOnce([{ id: 'd365-system-user-id' }]);
    const id = await resolveUserDbId('msal-local-account-id', 'dylan@ingrammicro.com');
    expect(id).toBe('d365-system-user-id');
  });

  it('falls back to the localAccountId when no row matches the email', async () => {
    select.mockResolvedValueOnce([]);
    const id = await resolveUserDbId('msal-local-account-id', 'dylan@ingrammicro.com');
    expect(id).toBe('msal-local-account-id');
  });

  it('returns the localAccountId without querying when email is empty', async () => {
    const id = await resolveUserDbId('msal-local-account-id', '');
    expect(id).toBe('msal-local-account-id');
    expect(select).not.toHaveBeenCalled();
  });
});
