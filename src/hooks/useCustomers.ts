'use client';

import { useEffect } from 'react';
import { useCustomerStore } from '@/store/customerStore';
import { queryAllCustomers } from '@/lib/db/queries/customers';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { mockCustomers } from '@/lib/mock/customers';

export function useCustomers() {
  const {
    customers, isLoading, setCustomers, setLoading, getFilteredCustomers,
  } = useCustomerStore();

  useEffect(() => {
    if (customers.length > 0) return;

    setLoading(true);
    const load = async () => {
      try {
        if (isTauriApp()) {
          const data = await queryAllCustomers();
          setCustomers(data);
        } else {
          // Browser dev mode — use mock data directly
          setCustomers(mockCustomers);
        }
      } catch (err) {
        console.error('[useCustomers] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customers.length, setCustomers, setLoading]);

  return {
    customers: getFilteredCustomers(),
    allCustomers: customers,
    isLoading,
  };
}
