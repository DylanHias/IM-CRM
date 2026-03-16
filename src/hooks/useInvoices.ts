'use client';

import { useEffect, useCallback } from 'react';
import { useInvoiceStore } from '@/store/invoiceStore';
import { getInvoiceAdapter } from '@/lib/api/invoiceAdapter';
import type { InvoiceSearchParams } from '@/types/invoice';

const adapter = getInvoiceAdapter();

export function useInvoices(resellerId: string | null, countryCode: string) {
  const {
    invoices, selectedDetail, isLoading, isLoadingDetail,
    totalRecords, currentPage, pageSize, searchFilters, error,
    setInvoices, setDetail, setLoading, setLoadingDetail,
    setPage, setFilters, setError, reset,
  } = useInvoiceStore();

  const loadInvoices = useCallback(async (page?: number, filters?: InvoiceSearchParams) => {
    if (!resellerId) return;
    setLoading(true);
    setError(null);
    try {
      const params: InvoiceSearchParams = {
        ...searchFilters,
        ...filters,
        pageSize,
        pageNumber: page ?? currentPage,
      };
      const result = await adapter.searchInvoices(resellerId, countryCode, params);
      setInvoices(result.invoices, result.recordsFound, result.pageNumber);
    } catch (err) {
      console.error('[useInvoices] Failed to load:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [resellerId, countryCode, pageSize, currentPage, searchFilters, setInvoices, setLoading, setError]);

  const loadInvoiceDetail = useCallback(async (invoiceNumber: string) => {
    if (!resellerId) return;
    setLoadingDetail(true);
    try {
      const detail = await adapter.getInvoiceDetail(invoiceNumber, resellerId, countryCode);
      setDetail(detail);
    } catch (err) {
      console.error('[useInvoices] Failed to load detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoice detail');
    } finally {
      setLoadingDetail(false);
    }
  }, [resellerId, countryCode, setDetail, setLoadingDetail, setError]);

  const goToPage = useCallback((page: number) => {
    setPage(page);
    loadInvoices(page);
  }, [setPage, loadInvoices]);

  const applyFilters = useCallback((filters: InvoiceSearchParams) => {
    setFilters(filters);
    loadInvoices(1, filters);
  }, [setFilters, loadInvoices]);

  useEffect(() => {
    if (resellerId) {
      reset();
      loadInvoices(1);
    } else {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resellerId]);

  return {
    invoices, selectedDetail, isLoading, isLoadingDetail,
    totalRecords, currentPage, pageSize, error,
    loadInvoices, loadInvoiceDetail, goToPage, applyFilters,
    closeDetail: () => setDetail(null),
  };
}
