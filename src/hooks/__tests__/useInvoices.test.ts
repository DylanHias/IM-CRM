import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useInvoices } from '@/hooks/useInvoices';
import { useInvoiceStore } from '@/store/invoiceStore';

vi.mock('@/lib/api/invoiceAdapter', () => ({
  getInvoiceAdapter: () => ({
    searchInvoices: vi.fn().mockResolvedValue({
      invoices: [
        {
          invoiceNumber: 'INV-001',
          invoiceStatus: 'Open',
          invoiceDate: '2026-01-15',
          invoiceDueDate: '2026-02-15',
          invoicedAmountDue: 1500,
          invoiceAmountInclTax: 1815,
          customerOrderNumber: 'CO-001',
          endCustomerOrderNumber: null,
          orderCreateDate: '2026-01-10',
          erpOrderNumber: 'ERP-001',
          paymentTermsDueDate: '2026-02-15',
        },
      ],
      recordsFound: 1,
      pageSize: 10,
      pageNumber: 1,
      nextPage: null,
    }),
    getInvoiceDetail: vi.fn().mockResolvedValue(null),
  }),
}));

describe('useInvoices', () => {
  beforeEach(() => {
    useInvoiceStore.getState().reset();
  });

  it('no-op when resellerId is null', async () => {
    const { result } = renderHook(() => useInvoices(null, 'BE'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.invoices).toEqual([]);
    expect(result.current.totalRecords).toBe(0);
  });

  it('resets on resellerId change', async () => {
    const { result, rerender } = renderHook(
      ({ resellerId }: { resellerId: string | null }) => useInvoices(resellerId, 'BE'),
      { initialProps: { resellerId: 'RES-001' } }
    );

    await waitFor(() => {
      expect(result.current.invoices.length).toBeGreaterThan(0);
    });

    rerender({ resellerId: 'RES-002' });

    await waitFor(() => {
      expect(result.current.currentPage).toBe(1);
    });
  });

  it('goToPage updates currentPage', async () => {
    const { result } = renderHook(() => useInvoices('RES-001', 'BE'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.goToPage(3);
    });

    await waitFor(() => {
      expect(result.current.currentPage).toBe(1);
    });
  });

  it('applyFilters resets to page 1', async () => {
    const { result } = renderHook(() => useInvoices('RES-001', 'BE'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    useInvoiceStore.setState({ currentPage: 5 });

    act(() => {
      result.current.applyFilters({ invoiceStatus: 'Paid' });
    });

    await waitFor(() => {
      expect(result.current.currentPage).toBe(1);
    });
  });

  it('closeDetail sets detail to null', async () => {
    const { result } = renderHook(() => useInvoices('RES-001', 'BE'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      useInvoiceStore.setState({
        selectedDetail: {
          invoiceNumber: 'INV-001',
          invoiceStatus: 'Open',
          invoiceDate: '2026-01-15',
          invoiceDueDate: '2026-02-15',
          customerOrderNumber: null,
          endCustomerOrderNumber: null,
          erpOrderNumber: null,
          orderCreateDate: null,
          billToInfo: { companyName: null, addressLine1: null, addressLine2: null, city: null, state: null, postalCode: null, countryCode: null },
          shipToInfo: { companyName: null, addressLine1: null, addressLine2: null, city: null, state: null, postalCode: null, countryCode: null },
          paymentTermsInfo: { paymentTermsDescription: null, paymentTermsDueDate: null, paymentTermsNetDays: null },
          lines: [],
          summary: { totalLines: 0, totalAmount: 0, totalTax: 0, totalAmountInclTax: 0, currencyCode: 'EUR' },
        },
      });
    });

    await waitFor(() => {
      expect(result.current.selectedDetail).not.toBeNull();
    });

    act(() => {
      result.current.closeDetail();
    });

    await waitFor(() => {
      expect(result.current.selectedDetail).toBeNull();
    });
  });
});
