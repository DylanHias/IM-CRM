import type { BreakdownRow, DimensionRow, Forecast } from '@/types/reports';

const OTHER = 'Other';

const nextMonth = (m: string) => {
  const [y, mo] = m.split('-').map(Number);
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`;
};

/**
 * Splits the 'overdue' sentinel from the forward months and zero-fills the months between them
 * (the query only returns months that have deals). Zeros here are real: no deal expected to close.
 */
export function forecastSeries(buckets: Forecast['buckets']) {
  const overdue = buckets.find((b) => b.month === 'overdue')?.value ?? null;
  const dated = buckets.filter((b) => b.month !== 'overdue').sort((a, b) => a.month.localeCompare(b.month));
  const months: { month: string; value: number }[] = [];
  if (dated.length > 0) {
    const byMonth = new Map(dated.map((b) => [b.month, b.value]));
    const last = dated[dated.length - 1].month;
    for (let m = dated[0].month; m <= last; m = nextMonth(m)) months.push({ month: m, value: byMonth.get(m) ?? 0 });
  }
  return { overdue, months };
}

/**
 * Largest `max` rows by value; the tail folds into one "Other" row so the bars still add up to the
 * total. A group genuinely labelled "Other" folds in with the tail — it is the same bucket, and two
 * rows with one label would reconcile to nothing.
 */
export function topWithOther(rows: BreakdownRow[], max: number): BreakdownRow[] {
  const named = rows.filter((r) => r.label !== OTHER);
  if (named.length === rows.length && rows.length <= max) return rows;
  const sorted = [...named].sort((a, b) => b.value - a.value);
  const tail = [...sorted.slice(max - 1), ...rows.filter((r) => r.label === OTHER)];
  if (tail.length === 0) return sorted;
  const other: BreakdownRow = {
    label: OTHER,
    value: tail.reduce((t, r) => t + r.value, 0),
    count: tail.reduce((t, r) => t + r.count, 0),
    excludedNonEur: tail.reduce((t, r) => t + r.excludedNonEur, 0),
  };
  return [...sorted.slice(0, max - 1), other];
}

/** The same roll-up for ARR-by-dimension rows, which carry account counts rather than deal money. */
export function topDimensionsWithOther(rows: DimensionRow[], max: number): DimensionRow[] {
  const named = rows.filter((r) => r.label !== OTHER);
  if (named.length === rows.length && rows.length <= max) return rows;
  const sorted = [...named].sort((a, b) => b.arr - a.arr);
  const tail = [...sorted.slice(max - 1), ...rows.filter((r) => r.label === OTHER)];
  if (tail.length === 0) return sorted;
  const other: DimensionRow = {
    label: OTHER,
    arr: tail.reduce((t, r) => t + r.arr, 0),
    accounts: tail.reduce((t, r) => t + r.accounts, 0),
    matched: tail.reduce((t, r) => t + r.matched, 0),
  };
  return [...sorted.slice(0, max - 1), other];
}
