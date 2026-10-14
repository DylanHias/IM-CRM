'use client';

import { useMemo } from 'react';
import { FilterField, FilterPopover } from '@/components/ui/filter-popover';
import { useOpportunityListStore, type ExpiredFilter } from '@/store/opportunityListStore';
import { STAGES } from '@/lib/opportunityRules';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import type { Opportunity, OpportunityStatus } from '@/types/entities';

/** Toolbar "Filters" button for the pipeline. "Mine" has its own button, so it isn't counted here. */
export function OpportunityFilterPopover() {
  const s = useOpportunityListStore();
  const { opportunities, customerMap } = s;
  const count = s.getActiveFilterCount() - (s.filterMineOnly ? 1 : 0);

  const options = useMemo(() => {
    const companies = Array.from(new Set(opportunities.map((o) => o.customerId)))
      .map((id) => ({ id, name: customerMap.get(id) ?? id }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const owners = (pick: (o: Opportunity) => [string | null, string | null]) => {
      const map = new Map<string, string>();
      for (const o of opportunities) {
        const [id, name] = pick(o);
        if (id && !map.has(id)) map.set(id, formatDisplayName(name || id));
      }
      return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
    };
    return {
      companies,
      primary: owners((o) => [o.createdById, o.createdByName]),
      secondary: owners((o) => [o.secondaryOwnerId, o.secondaryOwnerName]),
    };
  }, [opportunities, customerMap]);

  return (
    <FilterPopover title="Filter opportunities" count={count} mode={s.filterMode} onModeChange={s.setFilterMode} onClear={s.clearFilters}>
      <FilterField label="Stage" value={s.filterStage} allLabel="All stages" options={STAGES.map((st) => ({ id: st, name: st }))} onChange={s.setFilterStage} />
      <FilterField
        label="Status"
        value={s.filterStatus}
        allLabel="All statuses"
        options={(['Open', 'Won', 'Lost'] as OpportunityStatus[]).map((st) => ({ id: st, name: st }))}
        onChange={(v) => s.setFilterStatus(v as OpportunityStatus | null)}
      />
      <FilterField
        label="Expiration"
        value={s.filterExpired === 'all' ? null : s.filterExpired}
        allLabel="Any expiration"
        options={[{ id: 'active', name: 'Not expired' }, { id: 'expired', name: 'Expired' }]}
        onChange={(v) => s.setFilterExpired((v as ExpiredFilter | null) ?? 'all')}
      />
      <FilterField label="Company" value={s.filterCustomerId} allLabel="All companies" options={options.companies} onChange={s.setFilterCustomerId} />
      <FilterField label="Primary owner" value={s.filterPrimaryOwnerId} allLabel="All primary owners" options={options.primary} onChange={s.setFilterPrimaryOwnerId} />
      <FilterField label="Secondary owner" value={s.filterSecondaryOwnerId} allLabel="All secondary owners" options={options.secondary} onChange={s.setFilterSecondaryOwnerId} />
    </FilterPopover>
  );
}
