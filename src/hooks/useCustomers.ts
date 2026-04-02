'use client';

import { useEffect, useRef } from 'react';
import { useCustomerStore } from '@/store/customerStore';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { queryAllCustomers } from '@/lib/db/queries/customers';
import { queryAllContacts } from '@/lib/db/queries/contacts';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { useSettingsStore } from '@/store/settingsStore';
import { useD365UserId } from '@/hooks/useD365UserId';


export function useCustomers() {
  const {
    customers, allContacts, isLoading,
    setCustomers, setAllContacts, setLoading, getFilteredCustomers, setFilterOwnerId,
  } = useCustomerStore();
  const { account } = useAuthStore();
  const lastD365SyncAt = useSyncStore((s) => s.lastD365SyncAt);
  const d365UserId = useD365UserId();
  const appliedOwnerFilter = useRef(false);

  // Apply "show my customers first" default filter once on mount
  useEffect(() => {
    if (appliedOwnerFilter.current) return;
    const { defaultCustomerFilterOwner } = useSettingsStore.getState();
    const ownerId = d365UserId ?? account?.localAccountId;
    if (defaultCustomerFilterOwner && ownerId) {
      setFilterOwnerId(ownerId);
      appliedOwnerFilter.current = true;
    }
  }, [account, d365UserId, setFilterOwnerId]);

  // Load customers (re-runs after sync completes when list is still empty)
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
  }, [customers.length, lastD365SyncAt, setCustomers, setLoading]);

  // Load contacts for search (re-runs after sync completes when list is still empty)
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
  }, [allContacts.length, lastD365SyncAt, setAllContacts]);

  // Subscribe to trigger re-render when this setting changes (used inside getFilteredCustomers)
  useSettingsStore((s) => s.noRecentActivityDays);

  return {
    customers: getFilteredCustomers(),
    allCustomers: customers,
    isLoading,
  };
}
