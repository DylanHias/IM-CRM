import { describe, it, expect, beforeEach } from 'vitest';
import { useInvoiceStore } from '../invoiceStore';
import { createInvoiceSearchItem, createInvoiceDetail } from '@/__tests__/mocks/factories';

describe('invoiceStore', () => {
  beforeEach(() => {
    useInvoiceStore.getState().reset();
  });

  const store = () => useInvoiceStore.getState();

  it('initial state defaults', () => {
    expect(store().invoices).toHaveLength(0);
    expect(store().selectedDetail).toBeNull();
    expect(store().isLoading).toBe(false);
    expect(store().isLoadingDetail).toBe(false);
    expect(store().totalRecords).toBe(0);
    expect(store().currentPage).toBe(1);
    expect(store().pageSize).toBe(10);
    expect(store().error).toBeNull();
  });

  it('setInvoices sets invoices, totalRecords, currentPage', () => {
    const invoices = [createInvoiceSearchItem()];
    store().setInvoices(invoices, 100, 2);
    expect(store().invoices).toEqual(invoices);
    expect(store().totalRecords).toBe(100);
    expect(store().currentPage).toBe(2);
  });

  it('setDetail', () => {
    const detail = createInvoiceDetail();
    store().setDetail(detail);
    expect(store().selectedDetail).toEqual(detail);
  });

  it('setDetail null clears', () => {
    store().setDetail(createInvoiceDetail());
    store().setDetail(null);
    expect(store().selectedDetail).toBeNull();
  });

  it('setLoading', () => {
    store().setLoading(true);
    expect(store().isLoading).toBe(true);
  });

  it('setLoadingDetail', () => {
    store().setLoadingDetail(true);
    expect(store().isLoadingDetail).toBe(true);
  });

  it('setPage', () => {
    store().setPage(5);
    expect(store().currentPage).toBe(5);
  });

  it('setFilters sets filters and resets page to 1', () => {
    store().setPage(5);
    store().setFilters({ invoiceStatus: 'Open' });
    expect(store().searchFilters).toEqual({ invoiceStatus: 'Open' });
    expect(store().currentPage).toBe(1);
  });

  it('setError', () => {
    store().setError('Something went wrong');
    expect(store().error).toBe('Something went wrong');
  });

  it('reset clears all to defaults', () => {
    store().setInvoices([createInvoiceSearchItem()], 50, 3);
    store().setDetail(createInvoiceDetail());
    store().setError('error');
    store().reset();
    expect(store().invoices).toHaveLength(0);
    expect(store().selectedDetail).toBeNull();
    expect(store().totalRecords).toBe(0);
    expect(store().currentPage).toBe(1);
    expect(store().error).toBeNull();
  });
});
