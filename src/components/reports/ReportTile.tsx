import type { ReactNode } from 'react';
import { Metric } from '@/components/ui/metric-strip';

type Props = {
  label: string;
  /** Which population the figure covers, e.g. "all Benelux accounts" or "Cloud Belux team". */
  caption: string;
} & ({ value: ReactNode; empty?: never } | { empty: string; value?: never });

/** A key figure. When there is no data, `empty` replaces the value, so a missing figure can never read as zero. */
export function ReportTile({ label, value, caption, empty }: Props) {
  return (
    <Metric
      label={label}
      value={empty ? <span className="text-[13px] font-medium text-muted-foreground">{empty}</span> : value}
      sub={caption}
    />
  );
}
