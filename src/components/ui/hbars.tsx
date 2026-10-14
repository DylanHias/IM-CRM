import { cn } from '@/lib/utils';

interface Props {
  rows: { label: string; value: number }[];
  format?: (value: number) => string;
  labelWidth?: number;
  className?: string;
}

/** Horizontal bar list: label, proportional bar, value. */
export function HBars({ rows, format = String, labelWidth = 116, className }: Props) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className={cn('grid gap-[9px]', className)}>
      {rows.map((r) => (
        <div key={r.label} className="grid items-center gap-2.5 text-xs" style={{ gridTemplateColumns: `${labelWidth}px minmax(0,1fr) 64px` }}>
          <span className="truncate" title={r.label}>{r.label}</span>
          <div className="h-[7px] overflow-hidden rounded bg-sunken">
            <div className="h-full origin-left rounded bg-primary animate-in slide-in-from-left-2 duration-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="text-right tabular-nums text-foreground-2">{format(r.value)}</span>
        </div>
      ))}
    </div>
  );
}
