'use client';

import { Segmented } from '@/components/ui/segmented';
import { availablePeriods, periodKey, periodLabel, type ReportPeriod } from '@/lib/reports/period';
import { REGION_LABELS, type Region } from '@/lib/revenue/region';

export type ReportScopeKind = 'mine' | 'team';

export interface ReportFilters {
  scope: ReportScopeKind;
  region: Region;
  period: ReportPeriod;
}

const SCOPES: { value: ReportScopeKind; label: string }[] = [
  { value: 'mine', label: 'Mine' },
  { value: 'team', label: 'Team' },
];

const REGIONS = (Object.keys(REGION_LABELS) as Region[]).map((r) => ({ value: r, label: r === 'BENELUX' ? REGION_LABELS[r] : r }));

interface Props {
  filters: ReportFilters;
  onChange: (next: ReportFilters) => void;
}

/** Scope, country (Team only) and period. Every tab reads the same values, so they stay in step. */
export function ReportControls({ filters, onChange }: Props) {
  const periods = availablePeriods();
  return (
    <>
      <Segmented<ReportScopeKind> aria-label="Scope" value={filters.scope} onChange={(scope) => onChange({ ...filters, scope })} options={SCOPES} />
      {filters.scope === 'team' && (
        <Segmented<Region> aria-label="Country" value={filters.region} onChange={(region) => onChange({ ...filters, region })} options={REGIONS} />
      )}
      <select
        aria-label="Period"
        value={periodKey(filters.period)}
        onChange={(e) => onChange({ ...filters, period: periods.find((p) => periodKey(p) === e.target.value) ?? filters.period })}
        className="h-7 shrink-0 rounded-md border border-border-strong bg-card px-2 text-[12.5px]"
      >
        {periods.map((p) => (
          <option key={periodKey(p)} value={periodKey(p)}>{periodLabel(p)}</option>
        ))}
      </select>
    </>
  );
}
