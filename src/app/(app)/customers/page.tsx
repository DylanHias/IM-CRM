'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Bookmark, Search, X } from 'lucide-react';
import CustomerDetailClient from './CustomerDetailClient';
import { CustomerList } from '@/components/customers/CustomerList';
import { CustomerFilterPopover } from '@/components/customers/CustomerFilterPopover';
import { CustomerFilterChips } from '@/components/customers/CustomerFilterChips';
import { CustomerSortMenu } from '@/components/customers/CustomerSortMenu';
import { ViewBar, ViewBarSeparator } from '@/components/ui/view-bar';
import { FullBleed } from '@/components/ui/full-bleed';
import { CompactPager } from '@/components/ui/compact-pager';
import { Segmented } from '@/components/ui/segmented';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomers } from '@/hooks/useCustomers';
import { useCustomerFilterOptions } from '@/hooks/useCustomerFilterOptions';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import { useShortcutListener } from '@/hooks/useShortcuts';
import { useCustomerStore, type CloudScope } from '@/store/customerStore';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types/entities';

const CLOUD_OPTIONS: { value: CloudScope; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'noncloud', label: 'Non-cloud' },
];

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get('id');

  const { customers, allCustomers, isLoading } = useCustomers();
  const options = useCustomerFilterOptions();
  const page = useCustomerStore((s) => s.page);
  const setPage = useCustomerStore((s) => s.setPage);
  const searchQuery = useCustomerStore((s) => s.searchQuery);
  const setSearchQuery = useCustomerStore((s) => s.setSearchQuery);
  const filterCloud = useCustomerStore((s) => s.filterCloud);
  const setFilterCloud = useCustomerStore((s) => s.setFilterCloud);
  const filterFavorites = useCustomerStore((s) => s.filterFavorites);
  const toggleFavoritesFilter = useCustomerStore((s) => s.toggleFavoritesFilter);
  const { pageSize } = usePaginationPreference('customers', 15);

  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(customers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = customers.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectedId = customerId;

  const select = useCallback(
    (c: Customer) => {
      useCustomerStore.getState().setSelectedCustomerId(c.id);
      router.push(`/customers?id=${c.id}`);
    },
    [router],
  );

  const goBack = useCallback(() => {
    useCustomerStore.getState().setSelectedCustomerId(null);
    router.push('/customers');
  }, [router]);

  // Keep the selected row visible after keyboard moves and page changes.
  useEffect(() => {
    if (!selectedId) return;
    listRef.current?.querySelector(`[data-customer-id="${selectedId}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selectedId, safePage]);

  const move = useCallback(
    (delta: 1 | -1) => {
      const idx = customers.findIndex((c) => c.id === selectedId);
      const next = customers[Math.min(Math.max(idx + delta, 0), customers.length - 1)];
      if (!next || next.id === selectedId) return;
      const nextPage = Math.floor(customers.indexOf(next) / pageSize) + 1;
      if (nextPage !== safePage) setPage(nextPage);
      select(next);
    },
    [customers, selectedId, pageSize, safePage, setPage, select],
  );

  useShortcutListener('list-down', useCallback(() => move(1), [move]));
  useShortcutListener('list-up', useCallback(() => move(-1), [move]));
  useShortcutListener(
    'list-open',
    useCallback(() => document.querySelector<HTMLElement>('[role="tablist"] [aria-selected="true"]')?.focus(), []),
  );
  useShortcutListener('focus-search', useCallback(() => searchRef.current?.focus(), []));


  if (selectedId) {
    return (
      <>
        <ViewBar title="Customers">
          <ViewBarSeparator />
          <Button variant="outline" onClick={goBack}>
            <ArrowLeft size={14} />
            Back to customers
          </Button>
        </ViewBar>

        <FullBleed className="min-h-0">
          <CustomerDetailClient key={selectedId} customerId={selectedId} trackRecent />
        </FullBleed>
      </>
    );
  }

  return (
    <>
      <ViewBar
        title="Customers"
        meta={
          isLoading
            ? undefined
            : customers.length === allCustomers.length
              ? `${allCustomers.length} customers`
              : `${customers.length} of ${allCustomers.length}`
        }
      >
        <ViewBarSeparator />
        <Segmented aria-label="Cloud scope" value={filterCloud} onChange={setFilterCloud} options={CLOUD_OPTIONS} />
        <Button
          variant="outline"
          aria-pressed={filterFavorites}
          onClick={toggleFavoritesFilter}
          className={cn(filterFavorites && 'border-primary/40 bg-accent text-accent-foreground hover:bg-accent')}
        >
          <Bookmark size={14} className={cn(filterFavorites && 'fill-current')} />
          Favorites
        </Button>
        <CustomerFilterPopover options={options} />
      </ViewBar>

      <FullBleed className="grid min-h-0">
        <div data-tour="page-customers" className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden bg-card">
          <div className="grid gap-2 border-b border-border p-2">
            <div className="flex items-center gap-1">
              <div className="relative min-w-0 flex-1">
                <Search size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-faint" />
                <Input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customers…"
                  aria-label="Search customers"
                  className="pl-7 pr-7"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <CustomerSortMenu />
            </div>
            <CustomerFilterChips options={options} />
          </div>

          <div className="min-h-0 overflow-y-auto">
            {isLoading ? (
              <div className="grid">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 border-t border-border px-3 py-3 first:border-t-0">
                    <Skeleton className="size-7 rounded-[7px]" />
                    <div className="grid flex-1 gap-1.5">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <CustomerList ref={listRef} customers={paged} selectedId={selectedId} onSelect={select} />
            )}
          </div>

          <CompactPager page={safePage} pageSize={pageSize} total={customers.length} onPageChange={setPage} />
        </div>
      </FullBleed>
    </>
  );
}
