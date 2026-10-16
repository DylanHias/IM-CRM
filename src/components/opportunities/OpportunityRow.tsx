'use client';

import { forwardRef } from 'react';
import { Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ExpiryLabel, OpportunityStatusBadge } from '@/components/opportunities/OpportunityBadges';
import { compactMoney } from '@/lib/opportunities/display';
import { cn } from '@/lib/utils';
import type { Opportunity } from '@/types/entities';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  opportunity: Opportunity;
  companyName: string;
  selected?: boolean;
  /** Hide the company line (inside a customer's own tab). */
  hideCompany?: boolean;
}

/** Compact opportunity row: company, subject, stage + expiry, value + status. */
export const OpportunityRow = forwardRef<HTMLDivElement, Props>(({ opportunity: o, companyName, selected, hideCompany, className, ...props }, ref) => (
  <div
    ref={ref}
    role="option"
    aria-selected={selected ?? false}
    data-opportunity-id={o.id}
    className={cn(
      'relative flex min-w-0 cursor-default items-start gap-2.5 border-t border-border px-3 py-2 transition-colors first:border-t-0',
      selected ? 'bg-accent before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r before:bg-primary' : 'hover:bg-surface-2',
      className,
    )}
    {...props}
  >
    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[7px] bg-accent text-accent-foreground">
      <Target size={13} />
    </span>
    <div className="min-w-0 flex-1">
      {!hideCompany && <div className="truncate text-[13px] font-medium">{companyName}</div>}
      <div className={cn('truncate', hideCompany ? 'text-[13px] font-medium' : 'text-xs text-muted-foreground')}>{o.subject}</div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary">{o.stage}</Badge>
        {o.status === 'Open' && <ExpiryLabel date={o.expirationDate} />}
      </div>
    </div>
    <div className="grid shrink-0 justify-items-end gap-1">
      <span className="whitespace-nowrap text-xs font-semibold tabular-nums">{compactMoney(o.estimatedRevenue, o.currency)}</span>
      {o.status !== 'Open' && <OpportunityStatusBadge status={o.status} />}
    </div>
  </div>
));
OpportunityRow.displayName = 'OpportunityRow';
