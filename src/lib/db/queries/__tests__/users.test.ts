import { describe, it, expect, vi, beforeEach } from 'vitest';

const select = vi.fn();
const execute = vi.fn();

vi.mock('@/lib/db/client', () => ({
  getDb: vi.fn(async () => ({ select, execute })),
}));

import { resolveUserDbId, queryD365UserIdByEmail, getGraphProfile } from '@/lib/db/queries/users';

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

describe('getGraphProfile', () => {
  beforeEach(() => {
    select.mockReset();
    execute.mockReset();
  });

  it('falls back to the D365 title when the Graph job_title is empty', async () => {
    select.mockResolvedValueOnce([
      { job_title: null, title: 'Technical Account Manager', country: 'BE', city: null, office_location: null, birthday: null },
    ]);
    const profile = await getGraphProfile('d365-row');
    expect(profile?.jobTitle).toBe('Technical Account Manager');
  });

  it('prefers the Graph job_title over the D365 title when present', async () => {
    select.mockResolvedValueOnce([
      { job_title: 'Graph Title', title: 'D365 Title', country: null, city: null, office_location: null, birthday: null },
    ]);
    const profile = await getGraphProfile('d365-row');
    expect(profile?.jobTitle).toBe('Graph Title');
  });

  it('returns null when every profile field is empty', async () => {
    select.mockResolvedValueOnce([
      { job_title: null, title: null, country: null, city: null, office_location: null, birthday: null },
    ]);
    expect(await getGraphProfile('d365-row')).toBeNull();
  });
});
