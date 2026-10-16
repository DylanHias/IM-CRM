'use client';

import { SortMenu } from '@/components/ui/sort-menu';
import { useCustomerStore, type SortBy } from '@/store/customerStore';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'lastActivity', label: 'Last activity' },
  { value: 'health', label: 'Health' },
  { value: 'name', label: 'Name' },
  { value: 'city', label: 'City' },
  { value: 'industry', label: 'Industry' },
];

export function CustomerSortMenu() {
  const sortBy = useCustomerStore((s) => s.sortBy);
  const sortDir = useCustomerStore((s) => s.sortDir);
  const setSortBy = useCustomerStore((s) => s.setSortBy);
  const setSortDir = useCustomerStore((s) => s.setSortDir);
  return <SortMenu aria-label="Sort customers" options={SORT_OPTIONS} value={sortBy} dir={sortDir} onChange={setSortBy} onDirChange={setSortDir} />;
}
