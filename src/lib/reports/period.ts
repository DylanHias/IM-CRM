import { addMonths, eachMonthOfInterval, endOfMonth, format, startOfMonth, subMonths } from 'date-fns';

export type ReportPeriod =
  | { kind: 'rolling'; months: 3 | 6 | 12 }
  | { kind: 'quarter'; year: number; quarter: 1 | 2 | 3 | 4 };

const DAY = 'yyyy-MM-dd';
const MAX_MONTHS = 12; // Power BI keeps a rolling 12-month window

// The current month is partial, so every range ends at the last complete month.
function lastCompleteMonth(now: Date): Date {
  return startOfMonth(subMonths(now, 1));
}

function bounds(p: ReportPeriod, now: Date): { start: Date; end: Date } {
  if (p.kind === 'rolling') {
    const end = lastCompleteMonth(now);
    return { start: subMonths(end, p.months - 1), end: endOfMonth(end) };
  }
  const start = new Date(p.year, (p.quarter - 1) * 3, 1);
  return { start, end: endOfMonth(addMonths(start, 2)) };
}

export function periodRange(p: ReportPeriod, now: Date = new Date()): { from: string; to: string } {
  const { start, end } = bounds(p, now);
  return { from: format(start, DAY), to: format(end, DAY) };
}

export function monthKeys(p: ReportPeriod, now: Date = new Date()): string[] {
  const { start, end } = bounds(p, now);
  return eachMonthOfInterval({ start, end }).map((m) => format(m, 'yyyy-MM'));
}

export function availablePeriods(now: Date = new Date()): ReportPeriod[] {
  const windowStart = format(subMonths(lastCompleteMonth(now), MAX_MONTHS - 1), DAY);
  const windowEnd = format(endOfMonth(lastCompleteMonth(now)), DAY);
  const quarters: ReportPeriod[] = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 1; y--) {
    for (const quarter of [4, 3, 2, 1] as const) {
      const p: ReportPeriod = { kind: 'quarter', year: y, quarter };
      const { from, to } = periodRange(p, now);
      if (from >= windowStart && to <= windowEnd) quarters.push(p);
    }
  }
  return [
    { kind: 'rolling', months: 3 },
    { kind: 'rolling', months: 6 },
    { kind: 'rolling', months: 12 },
    ...quarters,
  ];
}

export function periodLabel(p: ReportPeriod): string {
  return p.kind === 'rolling' ? `Last ${p.months} months` : `Q${p.quarter} ${p.year}`;
}
