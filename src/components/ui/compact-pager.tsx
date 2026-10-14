import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** One-line pager for list panes: "11–20 of 63  ‹ 2 / 7 ›". Hidden when one page is enough. */
export function CompactPager({ page, pageSize, total, onPageChange, className }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const safe = Math.min(Math.max(page, 1), pages);
  const from = (safe - 1) * pageSize + 1;
  const to = Math.min(safe * pageSize, total);
  const btn = 'grid size-[26px] place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sunken hover:text-foreground disabled:pointer-events-none disabled:opacity-35';
  return (
    <div className={cn('flex min-w-0 items-center gap-1 whitespace-nowrap border-t border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground', className)}>
      <span className="tabular-nums">{from}–{to} of {total}</span>
      <span className="flex-1" />
      <button type="button" className={btn} aria-label="Previous page" disabled={safe <= 1} onClick={() => onPageChange(safe - 1)}>
        <ChevronLeft size={14} />
      </button>
      <span className="min-w-10 text-center tabular-nums text-foreground-2">{safe} / {pages}</span>
      <button type="button" className={btn} aria-label="Next page" disabled={safe >= pages} onClick={() => onPageChange(safe + 1)}>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
