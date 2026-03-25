import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('invoiceAdapter', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_XVANTAGE_API_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns MockInvoiceAdapter when no env var', async () => {
    const { getInvoiceAdapter } = await import('../invoiceAdapter');
    const adapter = getInvoiceAdapter();
    expect(adapter.constructor.name).toBe('MockInvoiceAdapter');
  });

  it('returns RealInvoiceAdapter when env var set', async () => {
    process.env.NEXT_PUBLIC_XVANTAGE_API_URL = 'https://api.example.com';
    const { getInvoiceAdapter } = await import('../invoiceAdapter');
    const adapter = getInvoiceAdapter();
    expect(adapter.constructor.name).toBe('RealInvoiceAdapter');
  });

  it('MockInvoiceAdapter.searchInvoices returns data', async () => {
    const { getInvoiceAdapter } = await import('../invoiceAdapter');
    const adapter = getInvoiceAdapter();
    const result = await adapter.searchInvoices('RES-001', 'BE');
    expect(result).toHaveProperty('invoices');
    expect(result).toHaveProperty('recordsFound');
  });

  it('MockInvoiceAdapter.getInvoiceDetail returns data or null', async () => {
    const { getInvoiceAdapter } = await import('../invoiceAdapter');
    const adapter = getInvoiceAdapter();
    const result = await adapter.getInvoiceDetail('INV-001', 'RES-001', 'BE');
    // Mock may return data or null depending on mock data
    expect(result === null || typeof result === 'object').toBe(true);
  });
});
