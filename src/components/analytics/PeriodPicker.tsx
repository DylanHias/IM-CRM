'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, subMonths, subYears, startOfDay, endOfDay, formatISO } from 'date-fns';
import type { PeriodKey, DateRange } from '@/types/analytics';

const PERIOD_LABELS: Record<PeriodKey, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 3 months',
  '6m': 'Last 6 months',
  '1y': 'Last year',
};

export function periodToRange(period: PeriodKey): DateRange {
  const now = new Date();
  const from = (() => {
    switch (period) {
      case '7d': return subDays(now, 7);
      case '30d': return subDays(now, 30);
      case '90d': return subDays(now, 90);
      case '6m': return subMonths(now, 6);
      case '1y': return subYears(now, 1);
    }
  })();
  return {
    from: formatISO(startOfDay(from)),
    to: formatISO(endOfDay(now)),
  };
}

export function prevPeriodRange(period: PeriodKey): DateRange {
  const current = periodToRange(period);
  const durationMs = new Date(current.to).getTime() - new Date(current.from).getTime();
  const prevTo = new Date(new Date(current.from).getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - durationMs);
  return {
    from: formatISO(prevFrom),
    to: formatISO(prevTo),
  };
}

interface PeriodPickerProps {
  value: PeriodKey;
  onChange: (period: PeriodKey) => void;
}

export function PeriodPicker({ value, onChange }: PeriodPickerProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as PeriodKey)}>
      <SelectTrigger className="h-8 w-[148px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(PERIOD_LABELS) as [PeriodKey, string][]).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
