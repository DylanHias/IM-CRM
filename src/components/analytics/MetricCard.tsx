'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  delta?: number;          // positive = good, negative = bad
  deltaLabel?: string;     // e.g. "vs prior period"
  sub?: string;            // secondary line below value
  className?: string;
}

/** One key figure. Inside a `.metric-grid` container the cards join into a single strip. */
export function MetricCard({ label, value, icon: Icon, delta, deltaLabel, sub, className }: MetricCardProps) {
  const hasDelta = delta !== undefined && delta !== null;
  const isPositive = hasDelta && delta > 0;
  const isNeutral = hasDelta && delta === 0;

  return (
    <div className={cn('grid min-w-0 content-start gap-[3px] rounded-[calc(var(--radius)*1.5)] border border-border bg-card px-3.5 py-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[11.5px] font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon size={13} className="shrink-0 text-faint" />}
      </div>
      <p className="text-[21px] font-semibold tabular-nums tracking-[-0.02em]">{value}</p>
      {(sub || hasDelta) && (
        <p className="truncate text-xs text-muted-foreground">
          {hasDelta && (
            <span className={cn('mr-1 text-[11.5px] font-semibold', isNeutral ? 'text-muted-foreground' : isPositive ? 'text-success' : 'text-destructive')}>
              {isPositive ? '+' : ''}{delta}
            </span>
          )}
          {hasDelta && deltaLabel}
          {sub && (hasDelta ? ` · ${sub}` : sub)}
        </p>
      )}
    </div>
  );
}
