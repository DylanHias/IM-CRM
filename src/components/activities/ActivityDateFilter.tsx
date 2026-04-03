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
import { subMonths, subYears, format, startOfMonth } from 'date-fns';

interface DateRange {
  from: string;
  to: string;
}

interface Props {
  onChange: (range: DateRange | null) => void;
}

type Preset = '3m' | '6m' | '1y' | 'all';

const PRESETS: { value: Preset; label: string }[] = [
  { value: '3m', label: 'Last 3 months' },
  { value: '6m', label: 'Last 6 months' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

function getRange(preset: Preset): DateRange | null {
  if (preset === 'all') return null;
  const now = new Date();
  const to = now.toISOString();
  const from =
    preset === '3m'
      ? startOfMonth(subMonths(now, 3)).toISOString()
      : preset === '6m'
        ? startOfMonth(subMonths(now, 6)).toISOString()
        : startOfMonth(subYears(now, 1)).toISOString();
  return { from, to };
}

export function ActivityDateFilter({ onChange }: Props) {
  const [preset, setPreset] = useState<Preset>('3m');

  useEffect(() => {
    onChange(getRange(preset));
  }, [preset, onChange]);

  const range = getRange(preset);

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
      {range && (
        <span className="text-xs text-muted-foreground">
          {format(new Date(range.from), 'MMM yyyy')} – {format(new Date(range.to), 'MMM yyyy')}
        </span>
      )}
    </div>
  );
}
