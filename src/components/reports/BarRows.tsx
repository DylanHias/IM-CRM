interface Row {
  label: string;
  value: number;
  sub?: string;
}

interface Props {
  rows: Row[];
  format: (n: number) => string;
  /** Accessible name for the list, e.g. "Pipeline by stage". */
  label: string;
}

/**
 * Ranked horizontal bars as plain DOM: the label and the figure are real text, so they stay
 * readable at any panel height and reachable by a screen reader, which an axis tick is not.
 */
export function BarRows({ rows, format, label }: Props) {
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return (
    <ul aria-label={label} className="min-h-0 overflow-y-auto px-3 py-1.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 py-1">
          <span className="truncate text-[12px]">{r.label}</span>
          <span className="whitespace-nowrap text-[12px] font-semibold tabular-nums">{format(r.value)}</span>
          <span className="h-1.5 rounded-full bg-sunken">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${(Math.abs(r.value) / max) * 100}%` }} />
          </span>
          <span className="whitespace-nowrap text-[11px] text-muted-foreground">{r.sub ?? ''}</span>
        </li>
      ))}
    </ul>
  );
}
