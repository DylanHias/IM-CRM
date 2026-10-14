import { afterEach, describe, expect, it, vi } from 'vitest';
import { d365RecordUrl } from '../recordUrl';

afterEach(() => vi.unstubAllEnvs());

describe('d365RecordUrl', () => {
  it('builds a record link from the configured org URL', () => {
    vi.stubEnv('NEXT_PUBLIC_D365_BASE_URL', 'https://org.crm4.dynamics.com/');
    expect(d365RecordUrl('account', 'abc-123')).toBe(
      'https://org.crm4.dynamics.com/main.aspx?pagetype=entityrecord&etn=account&id=abc-123',
    );
  });

  it('returns null without an org URL or id', () => {
    vi.stubEnv('NEXT_PUBLIC_D365_BASE_URL', '');
    expect(d365RecordUrl('account', 'abc')).toBeNull();
    vi.stubEnv('NEXT_PUBLIC_D365_BASE_URL', 'https://org.crm4.dynamics.com');
    expect(d365RecordUrl('opportunity', '')).toBeNull();
  });
});
