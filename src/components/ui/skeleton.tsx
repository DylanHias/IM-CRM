import * as React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('skeleton', className)}
      {...props}
    />
  );
}

interface ListRowsSkeletonProps {
  rows?: number;
  showRight?: boolean;
  className?: string;
}

export function ListRowsSkeleton({ rows = 6, showRight = true, className }: ListRowsSkeletonProps) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-border bg-card',
        className,
      )}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-2.5 px-3 py-[9px] animate-in fade-in slide-in-from-bottom-1 duration-300 fill-mode-backwards',
            i < rows - 1 && 'border-b border-border',
          )}
          style={{ animationDelay: `${Math.min(i, 7) * 20}ms` }}
        >
          <Skeleton className="size-7 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-[11px]" style={{ width: `${58 + ((i * 17) % 30)}%` }} />
            <Skeleton className="h-[9px]" style={{ width: `${30 + ((i * 11) % 25)}%` }} />
          </div>
          {showRight && (
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface TableRowsSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableRowsSkeleton({ rows = 6, cols = 4 }: TableRowsSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-border last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className={cn('h-3.5', c === 0 ? 'w-3/4' : 'w-1/2')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="grid gap-2 px-3.5 py-3">
      <Skeleton className="h-[9px] w-3/5" />
      <Skeleton className="h-[18px] w-[45%]" />
      <Skeleton className="h-2 w-[70%]" />
    </div>
  );
}

interface MetricCardsSkeletonProps {
  count?: number;
  cols?: 2 | 3 | 4;
  className?: string;
}

/** Placeholder for a MetricStrip: the figures sit side by side in one panel. */
export function MetricCardsSkeleton({ count = 4, cols = 4, className }: MetricCardsSkeletonProps) {
  return (
    <div
      className={cn('grid divide-x divide-border overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-border bg-card max-md:!grid-cols-2 max-md:divide-x-0', className)}
      style={{ gridTemplateColumns: `repeat(${Math.min(count, cols)}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  );
}

interface ChartCardSkeletonProps {
  height?: number;
  className?: string;
}

export function ChartCardSkeleton({ height = 200, className }: ChartCardSkeletonProps) {
  return (
    <div className={cn('overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-border bg-card', className)}>
      <div className="flex min-h-[38px] items-center border-b border-border px-3">
        <Skeleton className="h-3 w-[120px]" />
      </div>
      <div className="p-3">
        <Skeleton className="w-full" style={{ height }} />
      </div>
    </div>
  );
}

interface PanelSkeletonProps {
  metricCount?: number;
  metricCols?: 2 | 3 | 4;
  charts?: number;
  chartHeight?: number;
}

export function PanelSkeleton({
  metricCount = 4,
  metricCols = 4,
  charts = 2,
  chartHeight = 200,
}: PanelSkeletonProps) {
  const chartCols = charts > 1 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1';
  return (
    <div className="grid gap-3">
      {metricCount > 0 && <MetricCardsSkeleton count={metricCount} cols={metricCols} />}
      {charts > 0 && (
        <div className={cn('grid gap-3', chartCols)}>
          {Array.from({ length: charts }).map((_, i) => (
            <ChartCardSkeleton key={i} height={chartHeight} />
          ))}
        </div>
      )}
    </div>
  );
}
