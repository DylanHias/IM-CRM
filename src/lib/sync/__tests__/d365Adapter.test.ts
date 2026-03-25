import { describe, it, expect, beforeEach, vi, afterAll } from 'vitest';

describe('d365Adapter', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_D365_BASE_URL;
    delete process.env.NEXT_PUBLIC_SP_PENDING_ACTIVITIES_LIST_ID;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns MockD365Adapter when no env vars', async () => {
    const { getD365Adapter } = await import('../d365Adapter');
    const adapter = getD365Adapter();
    expect(adapter.constructor.name).toBe('MockD365Adapter');
  });

  it('returns RealD365Adapter when D365 URL set', async () => {
    process.env.NEXT_PUBLIC_D365_BASE_URL = 'https://d365.example.com';
    const { getD365Adapter } = await import('../d365Adapter');
    const adapter = getD365Adapter();
    expect(adapter.constructor.name).toBe('RealD365Adapter');
  });

  it('MockD365Adapter.fetchCustomers returns mock data', async () => {
    const { getD365Adapter } = await import('../d365Adapter');
    const adapter = getD365Adapter();
    const customers = await adapter.fetchCustomers('mock-token');
    expect(Array.isArray(customers)).toBe(true);
    expect(customers.length).toBeGreaterThan(0);
  });

  it('MockD365Adapter.pushActivity returns formatted ID', async () => {
    const { getD365Adapter } = await import('../d365Adapter');
    const adapter = getD365Adapter();
    const { createActivity } = await import('@/__tests__/mocks/factories');
    const activity = createActivity();
    const remoteId = await adapter.pushActivity('mock-token', activity);
    expect(remoteId).toMatch(/^D365-ACT-/);
  });

  it('MockD365Adapter.pushFollowUp returns formatted ID', async () => {
    const { getD365Adapter } = await import('../d365Adapter');
    const adapter = getD365Adapter();
    const { createFollowUp } = await import('@/__tests__/mocks/factories');
    const followUp = createFollowUp();
    const remoteId = await adapter.pushFollowUp('mock-token', followUp);
    expect(remoteId).toMatch(/^D365-FU-/);
  });
});
