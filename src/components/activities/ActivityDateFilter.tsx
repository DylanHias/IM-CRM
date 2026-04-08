'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { subMonths, subYears, format, startOfMonth, endOfMonth } from 'date-fns';

export interface ActivityDateRange {
  from: string;
  to: string;
}

interface Props {
  onChange: (range: ActivityDateRange | null, label: string | null) => void;
}

type Preset = '3m' | '6m' | '1y' | 'all';

const PRESETS: { value: Preset; label: string }[] = [
  { value: '3m', label: 'Last 3 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

function getRange(preset: Preset): ActivityDateRange | null {
  if (preset === 'all') return null;
  const monthStart = startOfMonth(new Date());
  const to = endOfMonth(new Date()).toISOString();
  const from =
    preset === '3m'
      ? subMonths(monthStart, 3).toISOString()
      : preset === '6m'
        ? subMonths(monthStart, 6).toISOString()
        : subYears(monthStart, 1).toISOString();
  return { from, to };
}

function getRangeLabel(range: ActivityDateRange | null): string | null {
  if (!range) return null;
  return `${format(new Date(range.from), 'MMM yyyy')} – ${format(new Date(range.to), 'MMM yyyy')}`;
}

export function ActivityDateFilter({ onChange }: Props) {
  const [preset, setPreset] = useState<Preset>('3m');

  useEffect(() => {
    const range = getRange(preset);
    onChange(range, getRangeLabel(range));
  }, [preset, onChange]);

  return (
    <div className="flex items-center gap-2">
      <Calendar size={14} className="text-muted-foreground" />
      <Select value={preset} onValueChange={(v) => setPreset(v as Preset)}>
        <SelectTrigger className="h-7 w-[160px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
