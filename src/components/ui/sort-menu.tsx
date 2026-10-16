'use client';

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Dir = 'asc' | 'desc';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  dir: Dir;
  onChange: (value: T) => void;
  onDirChange: (dir: Dir) => void;
  'aria-label': string;
}

/** Icon button that picks a sort field and direction from a menu. */
export function SortMenu<T extends string>({ options, value, dir, onChange, onDirChange, ...props }: Props<T>) {
  const label = options.find((o) => o.value === value)?.label ?? 'Sort';
  const Icon = dir === 'asc' ? ArrowUpNarrowWide : ArrowDownWideNarrow;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={`Sort: ${label}, ${dir === 'asc' ? 'ascending' : 'descending'}`}
          aria-label={props['aria-label']}
          className="grid size-[30px] shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sunken hover:text-foreground data-[state=open]:bg-sunken"
        >
          <Icon size={15} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>{o.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={dir} onValueChange={(v) => onDirChange(v as Dir)}>
          <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
