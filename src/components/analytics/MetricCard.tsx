'use client';

import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
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

export function MetricCard({ label, value, icon: Icon, delta, deltaLabel, sub, className }: MetricCardProps) {
  const hasDelta = delta !== undefined && delta !== null;
  const isPositive = hasDelta && delta > 0;
  const isNeutral = hasDelta && delta === 0;
  const DeltaIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={cn('rounded-xl border border-border/60 bg-card p-4 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider leading-tight">
          {label}
        </p>
        {Icon && <Icon size={15} className="text-muted-foreground/60 shrink-0 mt-0.5" />}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      {hasDelta && (
        <div
          className={cn(
            'mt-2 flex items-center gap-1 text-[11px] font-medium',
            isNeutral ? 'text-muted-foreground' : isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
          )}
        >
          <DeltaIcon size={12} />
          <span>{isPositive ? '+' : ''}{delta}</span>
          {deltaLabel && <span className="text-muted-foreground font-normal">{deltaLabel}</span>}
        </div>
      )}
    </div>
  );
}
