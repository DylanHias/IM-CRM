'use client';

import { useCallback, useState } from 'react';
import { ChevronDown, Combine, SlidersHorizontal, Split } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomerStore } from '@/store/customerStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useShortcutListener } from '@/hooks/useShortcuts';
import { displayCity } from '@/lib/utils/cityProvince';
import { cn } from '@/lib/utils';
import type { CustomerFilterOptions, FilterOption } from '@/hooks/useCustomerFilterOptions';
import type { HealthTier } from '@/lib/customers/healthScore';

export const HEALTH_TIER_OPTIONS: { value: HealthTier; label: string }[] = [
  { value: 'healthy', label: 'Healthy (70+)' },
  { value: 'atRisk', label: 'At risk (40–69)' },
  { value: 'critical', label: 'Critical (<40)' },
];

const ALL = '__all__';

interface FieldProps {
  label: string;
  value: string | null;
  allLabel: string;
  options: FilterOption[];
  onChange: (value: string | null) => void;
}

function FilterField({ label, value, allLabel, options, onChange }: FieldProps) {
  return (
    <label className="grid min-w-0 gap-1">
      <span className="text-[11.5px] font-medium text-muted-foreground">{label}</span>
      <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? null : v)}>
        <SelectTrigger className="h-[26px] text-xs" aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{allLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

const asOptions = (values: string[], label: (v: string) => string = (v) => v): FilterOption[] =>
  values.map((v) => ({ id: v, name: label(v) }));

interface Props {
  options: CustomerFilterOptions;
}

/** Toolbar "Filters" button that opens every customer filter in a popover. */
export function CustomerFilterPopover({ options }: Props) {
  const s = useCustomerStore();
  const noRecentActivityDays = useSettingsStore((st) => st.noRecentActivityDays);
  const [open, setOpen] = useState(false);
  const count = s.getActiveFilterCount() - (s.filterFavorites ? 1 : 0);

  useShortcutListener('toggle-filters', useCallback(() => setOpen((v) => !v), []));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-pressed={count > 0} className={cn(count > 0 && 'border-primary/40 bg-accent text-accent-foreground hover:bg-accent')}>
          <SlidersHorizontal size={14} />
          Filters
          {count > 0 && (
            <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{count}</span>
          )}
          <ChevronDown size={12} className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(560px,calc(100vw-24px))] p-0">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <b className="text-[13px] font-semibold">Filter customers</b>
          {count >= 2 && (
            <div className="ml-auto inline-flex rounded-md border border-border-strong p-0.5" role="group" aria-label="Combine filters">
              {(['and', 'or'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={s.filterMode === m}
                  onClick={() => s.setFilterMode(m)}
                  className="inline-flex h-[22px] items-center gap-1 rounded px-2 text-xs text-muted-foreground transition-colors aria-pressed:bg-accent aria-pressed:text-accent-foreground"
                >
                  {m === 'and' ? <Combine size={12} /> : <Split size={12} />}
                  {m === 'and' ? 'Match all' : 'Match any'}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid max-h-[60vh] grid-cols-2 gap-x-3 gap-y-2.5 overflow-y-auto p-3 sm:grid-cols-3">
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
        </div>
        <div className="flex items-center gap-2 border-t border-border bg-surface-2 px-3 py-2">
          <button type="button" className="text-xs font-medium text-accent-foreground hover:underline" onClick={s.clearFilters}>
            Clear all
          </button>
          <span className="flex-1" />
          <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
