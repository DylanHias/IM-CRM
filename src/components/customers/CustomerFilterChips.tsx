'use client';

import { X } from 'lucide-react';
import { useCustomerStore } from '@/store/customerStore';
import { displayCity } from '@/lib/utils/cityProvince';
import { HEALTH_TIER_OPTIONS } from '@/components/customers/CustomerFilterPopover';
import type { CustomerFilterOptions, FilterOption } from '@/hooks/useCustomerFilterOptions';

const nameOf = (list: FilterOption[], id: string) => list.find((o) => o.id === id)?.name ?? 'Unknown';

/** Removable chips for every active customer filter, shown above the list. */
export function CustomerFilterChips({ options }: { options: CustomerFilterOptions }) {
  const s = useCustomerStore();
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (s.filterStatus !== 'all') chips.push({ key: 'status', label: s.filterStatus === 'active' ? 'Active' : 'Inactive', clear: () => s.setFilterStatus('all') });
  if (s.filterOwnerId) chips.push({ key: 'owner', label: nameOf(options.owners, s.filterOwnerId), clear: () => s.setFilterOwnerId(null) });
  if (s.filterIndustry) chips.push({ key: 'industry', label: s.filterIndustry, clear: () => s.setFilterIndustry(null) });
  if (s.filterSegment) chips.push({ key: 'segment', label: s.filterSegment, clear: () => s.setFilterSegment(null) });
  if (s.filterCountry) chips.push({ key: 'country', label: s.filterCountry, clear: () => s.setFilterCountry(null) });
  if (s.filterCity) chips.push({ key: 'city', label: displayCity(s.filterCity), clear: () => s.setFilterCity(null) });
  if (s.filterCsmId) chips.push({ key: 'csm', label: `CSM: ${nameOf(options.cloudUsers, s.filterCsmId)}`, clear: () => s.setFilterCsmId(null) });
  if (s.filterAwsOwnerId) chips.push({ key: 'aws', label: `AWS: ${nameOf(options.cloudUsers, s.filterAwsOwnerId)}`, clear: () => s.setFilterAwsOwnerId(null) });
  if (s.filterAzureOwnerId) chips.push({ key: 'azure', label: `Azure: ${nameOf(options.cloudUsers, s.filterAzureOwnerId)}`, clear: () => s.setFilterAzureOwnerId(null) });
  if (s.filterInsideSalesOwnerId) chips.push({ key: 'is', label: `Inside sales: ${nameOf(options.cloudUsers, s.filterInsideSalesOwnerId)}`, clear: () => s.setFilterInsideSalesOwnerId(null) });
  if (s.filterAccountManagerId) chips.push({ key: 'am', label: `AM: ${nameOf(options.belgiumUsers, s.filterAccountManagerId)}`, clear: () => s.setFilterAccountManagerId(null) });
  if (s.filterNoRecentActivity) chips.push({ key: 'noact', label: 'No recent activity', clear: s.toggleNoRecentActivityFilter });
  if (s.filterFavorites) chips.push({ key: 'fav', label: 'Favorites', clear: s.toggleFavoritesFilter });
  if (s.filterHealthTier) chips.push({ key: 'health', label: HEALTH_TIER_OPTIONS.find((o) => o.value === s.filterHealthTier)?.label ?? 'Health', clear: () => s.setFilterHealthTier(null) });

  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.clear}
          title="Remove filter"
          className="inline-flex h-5 max-w-full items-center gap-1 truncate rounded-full border border-border bg-sunken px-[7px] text-[11px] font-medium text-foreground-2 transition-colors hover:border-border-strong"
        >
          {c.label}
          <X size={10} className="shrink-0 opacity-60" />
        </button>
      ))}
      <button type="button" onClick={s.clearFilters} className="ml-0.5 text-[11px] font-medium text-accent-foreground hover:underline">
        Clear all
      </button>
    </div>
  );
}
