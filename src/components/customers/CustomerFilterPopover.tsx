'use client';

import { Button } from '@/components/ui/button';
import { FilterField, FilterPopover, type FilterOption } from '@/components/ui/filter-popover';
import { useCustomerStore } from '@/store/customerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { displayCity } from '@/lib/utils/cityProvince';
import type { CustomerFilterOptions } from '@/hooks/useCustomerFilterOptions';
import type { HealthTier } from '@/lib/customers/healthScore';

export const HEALTH_TIER_OPTIONS: { value: HealthTier; label: string }[] = [
  { value: 'healthy', label: 'Healthy (70+)' },
  { value: 'atRisk', label: 'At risk (40–69)' },
  { value: 'critical', label: 'Critical (<40)' },
];

const asOptions = (values: string[], label: (v: string) => string = (v) => v): FilterOption[] =>
  values.map((v) => ({ id: v, name: label(v) }));

/** Toolbar "Filters" button with every customer filter. Favorites has its own button, so it isn't counted here. */
export function CustomerFilterPopover({ options }: { options: CustomerFilterOptions }) {
  const s = useCustomerStore();
  const noRecentActivityDays = useSettingsStore((st) => st.noRecentActivityDays);
  const count = s.getActiveFilterCount() - (s.filterFavorites ? 1 : 0);

  return (
    <FilterPopover title="Filter customers" count={count} mode={s.filterMode} onModeChange={s.setFilterMode} onClear={s.clearFilters}>
      <FilterField
        label="Status"
        value={s.filterStatus === 'all' ? null : s.filterStatus}
        allLabel="All statuses"
        options={[{ id: 'active', name: 'Active' }, { id: 'inactive', name: 'Inactive' }]}
        onChange={(v) => s.setFilterStatus((v as 'active' | 'inactive' | null) ?? 'all')}
      />
      <FilterField label="Owner" value={s.filterOwnerId} allLabel="All owners" options={options.owners} onChange={s.setFilterOwnerId} />
      <FilterField label="Industry" value={s.filterIndustry} allLabel="All industries" options={asOptions(options.industries)} onChange={s.setFilterIndustry} />
      <FilterField label="Segment" value={s.filterSegment} allLabel="All segments" options={asOptions(options.segments)} onChange={s.setFilterSegment} />
      <FilterField label="Country" value={s.filterCountry} allLabel="All countries" options={asOptions(options.countries)} onChange={s.setFilterCountry} />
      <FilterField label="City" value={s.filterCity} allLabel="All cities" options={asOptions(options.cities, displayCity)} onChange={s.setFilterCity} />
      <FilterField label="Customer Success Manager" value={s.filterCsmId} allLabel="All CSMs" options={options.cloudUsers} onChange={s.setFilterCsmId} />
      <FilterField label="AWS owner" value={s.filterAwsOwnerId} allLabel="All AWS owners" options={options.cloudUsers} onChange={s.setFilterAwsOwnerId} />
      <FilterField label="Azure owner" value={s.filterAzureOwnerId} allLabel="All Azure owners" options={options.cloudUsers} onChange={s.setFilterAzureOwnerId} />
      <FilterField label="Inside sales owner" value={s.filterInsideSalesOwnerId} allLabel="All inside sales owners" options={options.cloudUsers} onChange={s.setFilterInsideSalesOwnerId} />
      <FilterField label="Account manager" value={s.filterAccountManagerId} allLabel="All account managers" options={options.belgiumUsers} onChange={s.setFilterAccountManagerId} />
      <FilterField
        label="Health"
        value={s.filterHealthTier}
        allLabel="All health"
        options={HEALTH_TIER_OPTIONS.map((o) => ({ id: o.value, name: o.label }))}
        onChange={(v) => s.setFilterHealthTier(v as HealthTier | null)}
      />
      <div className="grid min-w-0 gap-1">
        <span className="text-[11.5px] font-medium text-muted-foreground">Activity</span>
        <Button
          variant="outline"
          size="sm"
          aria-pressed={s.filterNoRecentActivity}
          onClick={s.toggleNoRecentActivityFilter}
          className="justify-start aria-pressed:border-primary/40 aria-pressed:bg-accent aria-pressed:text-accent-foreground"
        >
          No activity ({noRecentActivityDays}d+)
        </Button>
      </div>
    </FilterPopover>
  );
}
