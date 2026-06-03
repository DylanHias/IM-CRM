import { describe, it, expect, vi, beforeEach } from 'vitest';

const select = vi.fn();
const execute = vi.fn();

vi.mock('@/lib/db/client', () => ({
  getDb: vi.fn(async () => ({ select, execute })),
}));

import { resolveUserDbId } from '@/lib/db/queries/users';

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
