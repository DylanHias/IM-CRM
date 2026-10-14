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
import { useCustomerStore, type SortBy, type SortDir } from '@/store/customerStore';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'lastActivity', label: 'Last activity' },
  { value: 'health', label: 'Health' },
  { value: 'name', label: 'Name' },
  { value: 'city', label: 'City' },
  { value: 'industry', label: 'Industry' },
];

/** Icon button next to the list search that picks the sort field and direction. */
export function CustomerSortMenu() {
  const sortBy = useCustomerStore((s) => s.sortBy);
  const sortDir = useCustomerStore((s) => s.sortDir);
  const setSortBy = useCustomerStore((s) => s.setSortBy);
  const setSortDir = useCustomerStore((s) => s.setSortDir);
  const label = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Sort';
  const Icon = sortDir === 'asc' ? ArrowUpNarrowWide : ArrowDownWideNarrow;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={`Sort: ${label}, ${sortDir === 'asc' ? 'ascending' : 'descending'}`}
          aria-label="Sort customers"
          className="grid size-[30px] shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sunken hover:text-foreground data-[state=open]:bg-sunken"
        >
          <Icon size={15} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          {SORT_OPTIONS.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>{o.label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={sortDir} onValueChange={(v) => setSortDir(v as SortDir)}>
          <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
