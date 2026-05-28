'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, Crosshair } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CobwebOverlay } from '@/components/easterEggs/CobwebOverlay';
import type { StaleOpportunity } from '@/lib/db/queries/opportunities';

interface Props {
  opportunities: StaleOpportunity[];
  loading: boolean;
}

function fmtCurrency(value: number | null, currency: string | null): string {
  if (value == null) return '—';
  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '';
  if (value >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${sym}${Math.round(value / 1_000)}k`;
  return `${sym}${Math.round(value)}`;
}

export function StaleOpportunitiesPanel({ opportunities, loading }: Props) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <AlertTriangle size={13} className="text-warning" />
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Stale Opportunities
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {loading ? '—' : opportunities.length}
        </span>
      </div>

      <div className="overflow-y-auto flex-1 min-h-0">
        {loading ? (
          <ul className="divide-y divide-border/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-2.5 px-4 py-3">
                <Skeleton className="w-7 h-7 rounded-md shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4 rounded" />
                  <Skeleton className="h-2.5 w-1/2 rounded" />
                </div>
              </li>
            ))}
          </ul>
        ) : opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
            <p className="text-sm text-muted-foreground">No stale opportunities. Nice.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {opportunities.map((o) => (
              <li
                key={o.id}
                className={cn(
                  'relative flex items-center gap-2.5 px-4 py-3 cursor-pointer',
                  'border-l-2 border-l-warning/60',
                  'hover:bg-accent/40 transition-colors',
                )}
                onClick={() => router.push(`/customers?id=${o.customerId}&tab=opportunities`)}
              >
                <CobwebOverlay daysStale={o.daysStale} />
                <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-warning/10">
                  <Crosshair size={13} className="text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-tight">{o.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{o.customerName}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-4 font-medium bg-warning/10 text-warning border-warning/40"
                  >
                    {o.daysStale}d
                  </Badge>
                  <div className="text-[10px] text-muted-foreground tabular-nums">
                    {fmtCurrency(o.estimatedRevenue, o.currency)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
