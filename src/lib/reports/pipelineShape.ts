import type { BreakdownRow, Forecast } from '@/types/reports';

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

/** Largest `max` rows by value; the tail folds into one "Other" row so the bars still add up to the total. */
export function topWithOther(rows: BreakdownRow[], max: number): BreakdownRow[] {
  if (rows.length <= max) return rows;
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const tail = sorted.slice(max - 1);
  const other: BreakdownRow = {
    label: 'Other',
    value: tail.reduce((t, r) => t + r.value, 0),
    count: tail.reduce((t, r) => t + r.count, 0),
    excludedNonEur: tail.reduce((t, r) => t + r.excludedNonEur, 0),
  };
  return [...sorted.slice(0, max - 1), other];
}
