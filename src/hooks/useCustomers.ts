'use client';

import { useEffect, useRef } from 'react';
import { useCustomerStore } from '@/store/customerStore';
import { useAuthStore } from '@/store/authStore';
import { queryAllCustomers } from '@/lib/db/queries/customers';
import { queryAllContacts } from '@/lib/db/queries/contacts';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { useSettingsStore } from '@/store/settingsStore';


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
        if (isTauriApp()) {
          const data = await queryAllCustomers();
          setCustomers(data);
        } else {
          setCustomers([]);
        }
      } catch (err) {
        console.error('[customer] Failed to load customers:', err);
        setCustomers([]);
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
          setAllContacts(contacts);
        } else {
          setAllContacts([]);
        }
      } catch (err) {
        console.error('[customer] Failed to load contacts:', err);
        setAllContacts([]);
      }
    };
    load();
  }, [allContacts.length, setAllContacts]);

  // Subscribe to noRecentActivityDays so the list re-filters when the setting changes
  const noRecentActivityDays = useSettingsStore((s) => s.noRecentActivityDays);

  return {
    customers: getFilteredCustomers(),
    allCustomers: customers,
    isLoading,
  };
}
