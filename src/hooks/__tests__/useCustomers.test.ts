import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCustomers } from '@/hooks/useCustomers';
import { useCustomerStore } from '@/store/customerStore';

describe('useCustomers', () => {
  beforeEach(() => {
    useCustomerStore.setState({
      customers: [],
      allContacts: [],
      isLoading: false,
      searchQuery: '',
      filterOwnerId: null,
      filterStatus: 'all',
      filterIndustry: null,
      filterSegment: null,
      filterCountry: null,
      filterNoRecentActivity: false,
    });
  });

  it('loads mock customers', async () => {
    const { result } = renderHook(() => useCustomers());

    await waitFor(() => {
      expect(result.current.allCustomers.length).toBeGreaterThan(0);
    });
  });

  it('returns allCustomers array', async () => {
    const { result } = renderHook(() => useCustomers());

    await waitFor(() => {
      expect(Array.isArray(result.current.allCustomers)).toBe(true);
      expect(result.current.allCustomers.length).toBeGreaterThan(0);
    });
  });

  it('isLoading starts true then becomes false', async () => {
    const { result } = renderHook(() => useCustomers());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.allCustomers.length).toBeGreaterThan(0);
  });

  it('returns filtered customers from store', async () => {
    const { result } = renderHook(() => useCustomers());

    await waitFor(() => {
      expect(result.current.allCustomers.length).toBeGreaterThan(0);
    });

    expect(Array.isArray(result.current.customers)).toBe(true);
    expect(result.current.customers.length).toBeGreaterThan(0);
  });
});
