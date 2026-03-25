'use client';

import { useEffect, useRef } from 'react';
import { useCustomerStore } from '@/store/customerStore';
import { useAuthStore } from '@/store/authStore';
import { queryAllCustomers } from '@/lib/db/queries/customers';
import { queryAllContacts } from '@/lib/db/queries/contacts';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { useSettingsStore } from '@/store/settingsStore';
import { mockCustomers } from '@/lib/mock/customers';
import { mockContacts } from '@/lib/mock/contacts';
import { seedMockData } from '@/lib/db/seed';
import { getDb } from '@/lib/db/client';

export function useCustomers() {
  const {
    customers, allContacts, isLoading,
    setCustomers, setAllContacts, setLoading, getFilteredCustomers, setFilterOwnerId,
  } = useCustomerStore();
  const { account } = useAuthStore();
  const appliedOwnerFilter = useRef(false);

  // Apply "show my customers first" default filter once on mount
  useEffect(() => {
    if (appliedOwnerFilter.current) return;
    const { defaultCustomerFilterOwner } = useSettingsStore.getState();
    if (defaultCustomerFilterOwner && account?.localAccountId) {
      setFilterOwnerId(account.localAccountId);
      appliedOwnerFilter.current = true;
    }
  }, [account, setFilterOwnerId]);

  // Load customers
  useEffect(() => {
    if (customers.length > 0) return;
    setLoading(true);
    const load = async () => {
      try {
        const useMock = useSettingsStore.getState().mockDataEnabled;
        if (!useMock && isTauriApp()) {
          let data = await queryAllCustomers();
          if (data.length === 0) {
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
        const useMock = useSettingsStore.getState().mockDataEnabled;
        if (!useMock && isTauriApp()) {
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
