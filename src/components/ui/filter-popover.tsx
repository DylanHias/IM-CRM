'use client';

import { useCallback, useState } from 'react';
import { ChevronDown, Combine, SlidersHorizontal, Split } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShortcutListener } from '@/hooks/useShortcuts';
import { cn } from '@/lib/utils';

export interface FilterOption {
  id: string;
  name: string;
}

const ALL = '__all__';

interface FieldProps {
  label: string;
  value: string | null;
  allLabel: string;
  options: FilterOption[];
  onChange: (value: string | null) => void;
}

/** One labelled dropdown inside a filter popover; the first entry clears the filter. */
export function FilterField({ label, value, allLabel, options, onChange }: FieldProps) {
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

interface PopoverProps {
  title: string;
  /** Number of active filters shown on the button. */
  count: number;
  /** How multiple filters combine; leave out for lists that only support "match all". */
  mode?: 'and' | 'or';
  onModeChange?: (mode: 'and' | 'or') => void;
  onClear: () => void;
  children: React.ReactNode;
}

/** Toolbar "Filters" button that opens all filters of a list in a popover. Toggles with the F shortcut. */
export function FilterPopover({ title, count, mode, onModeChange, onClear, children }: PopoverProps) {
  const [open, setOpen] = useState(false);
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
          <b className="text-[13px] font-semibold">{title}</b>
          {count >= 2 && mode && onModeChange && (
            <div className="ml-auto inline-flex rounded-md border border-border-strong p-0.5" role="group" aria-label="Combine filters">
              {(['and', 'or'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={mode === m}
                  onClick={() => onModeChange(m)}
                  className="inline-flex h-[22px] items-center gap-1 rounded px-2 text-xs text-muted-foreground transition-colors aria-pressed:bg-accent aria-pressed:text-accent-foreground"
                >
                  {m === 'and' ? <Combine size={12} /> : <Split size={12} />}
                  {m === 'and' ? 'Match all' : 'Match any'}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid max-h-[60vh] grid-cols-2 gap-x-3 gap-y-2.5 overflow-y-auto p-3 sm:grid-cols-3">{children}</div>
        <div className="flex items-center gap-2 border-t border-border bg-surface-2 px-3 py-2">
          <button type="button" className="text-xs font-medium text-accent-foreground hover:underline" onClick={onClear}>
            Clear all
          </button>
          <span className="flex-1" />
          <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
