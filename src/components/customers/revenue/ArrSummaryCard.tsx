'use client';

import { TrendingUp, Calendar, Radio, Database } from 'lucide-react';
import { useCustomerRevenue } from '@/hooks/useCustomerRevenue';
import { getEffectiveArr, type Currency } from '@/lib/revenue/effectiveArr';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Customer } from '@/types/entities';

interface Props {
  customer: Pick<Customer, 'arr' | 'arrCurrency' | 'bcn'>;
  currency: Currency;
  className?: string;
}

function formatArr(value: number | null, currency: string | null): string {
  if (value === null) return '—';
  const cur = currency ?? 'USD';
  try {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${cur} ${value.toLocaleString('nl-BE', { maximumFractionDigits: 0 })}`;
  }
}

function formatMonth(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}

export function ArrSummaryCard({ customer, currency, className }: Props) {
  const revenue = useCustomerRevenue(customer.bcn);
  const effective = getEffectiveArr(customer, revenue, currency);

  const isLive = effective.source === 'powerbi';
  const isSynced = effective.source === 'd365';

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-3',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <TrendingUp size={13} />
          Current ARR
        </div>
        {isLive && (
          <Badge variant="default" className="gap-1 h-5 text-[10px]">
            <Radio size={9} />
            Live
          </Badge>
        )}
        {isSynced && (
          <Badge variant="secondary" className="gap-1 h-5 text-[10px]">
            <Database size={9} />
            Synced
          </Badge>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums text-foreground">
          {formatArr(effective.value, effective.currency)}
        </span>
        {effective.currency && effective.value !== null && (
          <span className="text-xs text-muted-foreground">{effective.currency}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar size={11} />
        {isLive
          ? <>As of {formatMonth(effective.asOfMonth)}</>
          : isSynced
          ? 'Last synced from D365'
          : 'No revenue data yet — refresh in Admin → Revenue Sync'}
      </div>
    </div>
  );
}
