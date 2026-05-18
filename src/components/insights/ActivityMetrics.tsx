'use client';

import { useMemo } from 'react';
import { Users2, Armchair, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useResellerSeatsTrend } from '@/hooks/useResellerSeatsTrend';
import { PowerBiUnavailable } from '@/components/revenue/PowerBiUnavailable';
import { REGION_COUNTRIES, type Region } from '@/lib/revenue/region';
import { cn } from '@/lib/utils';

interface Props {
  region: Region;
  monthsBack: number;
  className?: string;
}

function formatInt(value: number): string {
  return new Intl.NumberFormat('nl-BE', { maximumFractionDigits: 0 }).format(value);
}

function formatMonthLabel(iso: string): string {
  const [y, m] = iso.split('-');
  if (!y || !m) return iso;
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

function pct(curr: number, prev: number): number | null {
  if (!prev || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

interface MetricProps {
  label: string;
  value: string;
  hint?: string;
  icon: typeof Users2;
  delta?: number | null;
}

function MetricCard({ label, value, hint, icon: Icon, delta }: MetricProps) {
  const isUp = delta !== undefined && delta !== null && delta >= 0;
  const showDelta = delta !== undefined && delta !== null;
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon size={13} />
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-semibold tabular-nums text-foreground">{value}</div>
        {showDelta && (
          <div
            className={cn(
              'flex items-center gap-0.5 text-xs font-medium',
              isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
            )}
          >
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {`${isUp ? '+' : ''}${delta!.toFixed(1)}%`}
          </div>
        )}
      </div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function ActivityMetrics({ region, monthsBack, className }: Props) {
  const countryCodes = useMemo(() => REGION_COUNTRIES[region], [region]);
  const { points, isLoading, error } = useResellerSeatsTrend(monthsBack, countryCodes);

  const latest = points[points.length - 1];
  const earliest = points.length > 1 ? points[0] : undefined;

  const resellerDelta = latest && earliest ? pct(latest.activeResellers, earliest.activeResellers) : null;
  const seatDelta = latest && earliest ? pct(latest.activeSeats, earliest.activeSeats) : null;

  const asOf = latest ? formatMonthLabel(latest.month) : null;
  const earliestLabel = earliest ? formatMonthLabel(earliest.month) : null;

  if (error) {
    return <PowerBiUnavailable className={className} />;
  }

  if (isLoading && !latest) {
    return (
      <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card p-5 shadow-sm flex items-center justify-center h-28 text-xs text-muted-foreground"
          >
            <Loader2 size={14} className="mr-2 animate-spin" />
            Loading…
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      <MetricCard
        label="Active resellers"
        icon={Users2}
        value={latest ? formatInt(latest.activeResellers) : '—'}
        hint={asOf ? `As of ${asOf}` : undefined}
      />
      <MetricCard
        label="Active seats"
        icon={Armchair}
        value={latest ? formatInt(latest.activeSeats) : '—'}
        hint={asOf ? `As of ${asOf}` : undefined}
      />
      <MetricCard
        label="Reseller growth"
        icon={TrendingUp}
        value={resellerDelta !== null ? `${resellerDelta >= 0 ? '+' : ''}${resellerDelta.toFixed(1)}%` : '—'}
        delta={resellerDelta}
        hint={earliestLabel && asOf ? `${earliestLabel} → ${asOf}` : undefined}
      />
      <MetricCard
        label="Seat growth"
        icon={TrendingUp}
        value={seatDelta !== null ? `${seatDelta >= 0 ? '+' : ''}${seatDelta.toFixed(1)}%` : '—'}
        delta={seatDelta}
        hint={earliestLabel && asOf ? `${earliestLabel} → ${asOf}` : undefined}
      />
    </div>
  );
}
