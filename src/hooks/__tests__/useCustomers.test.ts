import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCustomers } from '@/hooks/useCustomers';
import { useCustomerStore } from '@/store/customerStore';
import { mockCustomers } from '@/lib/mock/customers';
import { mockContacts } from '@/lib/mock/contacts';

describe('useCustomers', () => {
  beforeEach(() => {
    useCustomerStore.setState({
      customers: mockCustomers,
      allContacts: mockContacts,
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

  it('returns customers from store', () => {
    const { result } = renderHook(() => useCustomers());
    expect(result.current.allCustomers.length).toBeGreaterThan(0);
  });

  it('returns allCustomers array', () => {
    const { result } = renderHook(() => useCustomers());
    expect(Array.isArray(result.current.allCustomers)).toBe(true);
    expect(result.current.allCustomers.length).toBeGreaterThan(0);
  });

  it('isLoading is false when store is populated', () => {
    const { result } = renderHook(() => useCustomers());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.allCustomers.length).toBeGreaterThan(0);
  });

  it('returns filtered customers from store', () => {
    const { result } = renderHook(() => useCustomers());
    expect(Array.isArray(result.current.customers)).toBe(true);
    expect(result.current.customers.length).toBeGreaterThan(0);
  });
});
