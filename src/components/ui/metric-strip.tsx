import * as React from 'react';
import { cn } from '@/lib/utils';

/** A single panel holding several key figures side by side, separated by thin dividers. */
const MetricStrip = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ className, children, style, ...props }, ref) => {
  const count = React.Children.toArray(children).filter(Boolean).length;
  return (
    <section
      ref={ref}
      className={cn(
        'grid min-w-0 divide-x divide-border overflow-hidden rounded-[calc(var(--radius)*1.5)] border border-border bg-card max-md:!grid-cols-2 max-md:divide-x-0',
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, ...style }}
      {...props}
    >
      {children}
    </section>
  );
});
MetricStrip.displayName = 'MetricStrip';

interface MetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  delta?: { text: string; positive: boolean };
  aside?: React.ReactNode;
}

const Metric = React.forwardRef<HTMLDivElement, MetricProps>(({ label, value, sub, delta, aside, className, children, ...props }, ref) => (
  <div ref={ref} className={cn('grid min-w-0 content-start gap-[3px] px-3.5 py-3', className)} {...props}>
    <span className="truncate text-[11.5px] font-medium text-muted-foreground">{label}</span>
    <span className="text-[21px] font-semibold tabular-nums tracking-[-0.02em]">{value}</span>
    {(sub || delta || aside) && (
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {delta && (
            <span className={cn('mr-1 text-[11.5px] font-semibold', delta.positive ? 'text-success' : 'text-destructive')}>{delta.text}</span>
          )}
          {sub}
        </span>
        {aside}
      </div>
    )}
    {children}
  </div>
));
Metric.displayName = 'Metric';

export { MetricStrip, Metric };
