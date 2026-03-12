'use client';

import { useEffect } from 'react';
import { useCustomerStore } from '@/store/customerStore';
import { queryAllCustomers } from '@/lib/db/queries/customers';
import { queryAllContacts } from '@/lib/db/queries/contacts';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { mockCustomers } from '@/lib/mock/customers';
import { mockContacts } from '@/lib/mock/contacts';

export function useCustomers() {
  const {
    customers, allContacts, isLoading,
    setCustomers, setAllContacts, setLoading, getFilteredCustomers,
  } = useCustomerStore();

  // Load customers
  useEffect(() => {
    if (customers.length > 0) return;
    setLoading(true);
    const load = async () => {
      try {
        if (isTauriApp()) {
          const data = await queryAllCustomers();
          setCustomers(data);
        } else {
          setCustomers(mockCustomers);
        }
      } catch (err) {
        console.error('[useCustomers] Failed to load customers:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customers.length, setCustomers, setLoading]);

  // Load contacts for search — separate effect so it always runs even if customers are already cached
  useEffect(() => {
    if (allContacts.length > 0) return;
    const load = async () => {
      try {
        if (isTauriApp()) {
          const contacts = await queryAllContacts();
          setAllContacts(contacts);
        } else {
          setAllContacts(mockContacts);
        }
      } catch (err) {
        console.error('[useCustomers] Failed to load contacts:', err);
      }
    };
    load();
  }, [allContacts.length, setAllContacts]);

  return {
    customers: getFilteredCustomers(),
    allCustomers: customers,
    isLoading,
  };
}
