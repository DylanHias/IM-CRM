'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCustomerStore } from '@/store/customerStore';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import { getUniqueCities } from '@/lib/utils/cityProvince';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryAllCloudBeluxUsers, type CloudBeluxUser } from '@/lib/db/queries/cloudBeluxUsers';
import { queryAllBelgiumTeamUsers, type BelgiumTeamUser } from '@/lib/db/queries/belgiumTeamUsers';

export interface FilterOption {
  id: string;
  name: string;
}

const byName = (a: FilterOption, b: FilterOption) => a.name.localeCompare(b.name);

/** Choices for every customer filter, derived from the loaded customers and the team user lists. */
export function useCustomerFilterOptions() {
  const customers = useCustomerStore((s) => s.customers);
  const filterCountry = useCustomerStore((s) => s.filterCountry);
  const [cloudUsers, setCloudUsers] = useState<CloudBeluxUser[]>([]);
  const [belgiumUsers, setBelgiumUsers] = useState<BelgiumTeamUser[]>([]);

  useEffect(() => {
    if (!isTauriApp()) return;
    const load = async () => {
      try {
        const [cloud, belgium] = await Promise.all([queryAllCloudBeluxUsers(), queryAllBelgiumTeamUsers()]);
        setCloudUsers(cloud);
        setBelgiumUsers(belgium);
      } catch (err) {
        console.error('[customer] Failed to load team users for filters:', err);
      }
    };
    load();
  }, []);

  return useMemo(() => {
    const ownerMap = new Map<string, string>();
    customers.forEach((c) => {
      if (c.ownerId && c.ownerName) ownerMap.set(c.ownerId, formatDisplayName(c.ownerName));
    });
    const distinct = (values: (string | null)[]) => Array.from(new Set(values.filter(Boolean) as string[])).sort();
    const citySource = filterCountry ? customers.filter((c) => c.addressCountry === filterCountry) : customers;
    return {
      owners: Array.from(ownerMap, ([id, name]) => ({ id, name })).sort(byName),
      industries: distinct(customers.map((c) => c.industry)),
      segments: distinct(customers.map((c) => c.segment)),
      countries: distinct(customers.map((c) => c.addressCountry)),
      cities: getUniqueCities(citySource.map((c) => c.addressCity)),
      cloudUsers: cloudUsers.map((u) => ({ id: u.id, name: formatDisplayName(u.name) })).sort(byName),
      belgiumUsers: belgiumUsers.map((u) => ({ id: u.id, name: formatDisplayName(u.name) })).sort(byName),
    };
  }, [customers, filterCountry, cloudUsers, belgiumUsers]);
}

export type CustomerFilterOptions = ReturnType<typeof useCustomerFilterOptions>;
