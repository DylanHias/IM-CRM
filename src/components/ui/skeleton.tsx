import * as React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-muted rounded animate-skeleton-pulse', className)}
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
        'flex flex-col rounded-xl bg-card overflow-hidden border border-border/60 shadow-sm',
        className,
      )}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-3 px-4 py-3',
            i < rows - 1 && 'border-b border-border/60',
          )}
        >
          <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
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
        <tr key={r} className="border-b border-border/40 last:border-0">
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
    <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-4 rounded shrink-0" />
      </div>
      <Skeleton className="mt-3 h-7 w-20" />
      <Skeleton className="mt-2 h-3 w-28" />
    </div>
  );
}

interface MetricCardsSkeletonProps {
  count?: number;
  cols?: 2 | 3 | 4;
  className?: string;
}

export function MetricCardsSkeleton({ count = 4, cols = 4, className }: MetricCardsSkeletonProps) {
  const gridCols =
    cols === 2 ? 'grid-cols-2'
    : cols === 3 ? 'grid-cols-1 sm:grid-cols-3'
    : 'grid-cols-2 lg:grid-cols-4';
  return (
    <div className={cn('grid gap-3', gridCols, className)}>
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
    <div className={cn('rounded-xl border border-border/60 bg-card p-4 shadow-sm', className)}>
      <Skeleton className="h-3 w-32 mb-2" />
      <Skeleton className="h-3 w-48 mb-4" />
      <Skeleton className="w-full" style={{ height }} />
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      {metricCount > 0 && <MetricCardsSkeleton count={metricCount} cols={metricCols} />}
      {charts > 0 && (
        <div className={cn('grid gap-4', chartCols)}>
          {Array.from({ length: charts }).map((_, i) => (
            <ChartCardSkeleton key={i} height={chartHeight} />
          ))}
        </div>
      )}
    </div>
  );
}
