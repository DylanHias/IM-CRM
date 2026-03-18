'use client';

import { useEffect } from 'react';
import { useCustomerStore } from '@/store/customerStore';
import { queryAllCustomers } from '@/lib/db/queries/customers';
import { queryAllContacts } from '@/lib/db/queries/contacts';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { mockCustomers } from '@/lib/mock/customers';
import { mockContacts } from '@/lib/mock/contacts';
import { seedMockData } from '@/lib/db/seed';
import { getDb } from '@/lib/db/client';

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
          let data = await queryAllCustomers();
          if (data.length === 0) {
            // DB is empty — seed mock data so FK references work for creates
            const db = await getDb();
            await seedMockData(db);
            data = await queryAllCustomers();
          }
          setCustomers(data.length > 0 ? data : mockCustomers);
        } else {
          setCustomers(mockCustomers);
        }
      } catch (err) {
        console.error('[useCustomers] Failed to load customers:', err);
        setCustomers(mockCustomers);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customers.length, setCustomers, setLoading]);

  // Load contacts for search
  useEffect(() => {
    if (allContacts.length > 0) return;
    const load = async () => {
      try {
        if (isTauriApp()) {
          const contacts = await queryAllContacts();
          setAllContacts(contacts.length > 0 ? contacts : mockContacts);
        } else {
          setAllContacts(mockContacts);
        }
      } catch (err) {
        console.error('[useCustomers] Failed to load contacts:', err);
        setAllContacts(mockContacts);
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
