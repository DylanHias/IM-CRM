'use client';

import { forwardRef } from 'react';
import { Bookmark, Building2 } from 'lucide-react';
import { useCustomerStore } from '@/store/customerStore';
import { useRevenueStore } from '@/store/revenueStore';
import { EmptyState } from '@/components/ui/empty-state';
import { CustomerContextMenu } from '@/components/customers/CustomerContextMenu';
import { formatRelative } from '@/lib/utils/dateUtils';
import { healthTier, healthTierLabel } from '@/lib/customers/healthScore';
import { getEffectiveArr } from '@/lib/revenue/effectiveArr';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types/entities';

const TIER_DOT = { healthy: 'bg-success', atRisk: 'bg-warning', critical: 'bg-destructive' } as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w[0] ?? ''))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function compactEur(value: number | null): string {
  if (value === null || value <= 0) return '';
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${Math.round(value / 1_000)}K`;
  return `€${Math.round(value)}`;
}

interface CustomerListProps {
  customers: Customer[];
  selectedId: string | null;
  onSelect: (customer: Customer) => void;
}

/** Compact, selectable customer rows for the list pane. */
export const CustomerList = forwardRef<HTMLDivElement, CustomerListProps>(({ customers, selectedId, onSelect }, ref) => {
  const favoriteIds = useCustomerStore((s) => s.favoriteIds);
  const toggleFavorite = useCustomerStore((s) => s.toggleFavorite);
  const byBcn = useRevenueStore((s) => s.byBcn);
  const byResellerAccount = useRevenueStore((s) => s.byResellerAccount);

  if (customers.length === 0) {
    return <EmptyState icon={Building2} title="No customers found" description="Try adjusting your search or filters" />;
  }

  return (
    <div ref={ref} role="listbox" aria-label="Customers" className="grid">
      {customers.map((c) => {
        const selected = c.id === selectedId;
        const fav = favoriteIds.has(c.id);
        const tier = healthTier(c.healthScore);
        const revenue = (c.bcn ? byBcn.get(c.bcn) : undefined) ?? (c.accountNumber ? byResellerAccount.get(c.accountNumber) : undefined) ?? null;
        const arr = compactEur(getEffectiveArr(c, revenue).value);
        return (
          <CustomerContextMenu key={c.id} customer={c}>
          <div
            role="option"
            aria-selected={selected}
            data-customer-id={c.id}
            tabIndex={-1}
            onClick={() => onSelect(c)}
            className={cn(
              'group/row relative flex min-h-[46px] min-w-0 cursor-default items-center gap-2.5 border-t border-border px-3 py-1.5 transition-colors first:border-t-0',
              selected
                ? 'bg-accent before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r before:bg-primary'
                : 'hover:bg-surface-2',
            )}
          >
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-[7px] border text-[10px] font-semibold',
                selected ? 'border-primary/30 bg-card text-accent-foreground' : 'border-border bg-sunken text-foreground-2',
              )}
            >
              {initials(c.name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium">{c.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {c.healthScore !== null && (
                  <>
                    <span className={cn('mr-1.5 inline-block size-[7px] rounded-full', TIER_DOT[tier])} title={`Health ${c.healthScore} · ${healthTierLabel(tier)}`} />
                    {c.healthScore} ·{' '}
                  </>
                )}
                {c.addressCity && <>{c.addressCity} · </>}
                {c.lastActivityAt ? formatRelative(c.lastActivityAt) : 'No activity'}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(c.id);
              }}
              title={fav ? 'Remove from favorites' : 'Add to favorites'}
              aria-label={fav ? `Remove ${c.name} from favorites` : `Add ${c.name} to favorites`}
              className={cn('bookmark-btn shrink-0 p-0.5 transition-opacity', fav ? 'text-primary' : 'text-faint opacity-0 hover:text-foreground group-hover/row:opacity-100')}
            >
              <Bookmark size={14} className={cn(fav && 'fill-current')} />
            </button>
            {arr && <span className="shrink-0 whitespace-nowrap text-xs font-semibold tabular-nums">{arr}</span>}
          </div>
          </CustomerContextMenu>
        );
      })}
    </div>
  );
});
CustomerList.displayName = 'CustomerList';
