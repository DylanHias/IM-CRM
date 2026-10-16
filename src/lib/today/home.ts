import type { FollowUp } from '@/types/entities';

const DAY_MS = 86_400_000;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;

/** Local calendar date as YYYY-MM-DD. */
export function localDateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const dueKey = (f: Pick<FollowUp, 'dueDate'>) => f.dueDate.slice(0, 10);

/** Open follow-ups that are overdue or due today, oldest first. */
export function selectDueToday(followUps: FollowUp[], today: Date): FollowUp[] {
  const key = localDateKey(today);
  return followUps
    .filter((f) => !f.completed && dueKey(f) <= key)
    .sort((a, b) => dueKey(a).localeCompare(dueKey(b)));
}

export interface WeekDay {
  label: (typeof WEEKDAYS)[number];
  day: number;
  key: string;
  count: number;
  isToday: boolean;
}

/** Monday–Friday of the current week (the coming week on a weekend) with open follow-up counts. */
export function workWeek(followUps: FollowUp[], today: Date): WeekDay[] {
  const dow = today.getDay(); // 0 = Sunday
  const offset = dow === 0 ? 1 : dow === 6 ? 2 : 1 - dow;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
  const todayKey = localDateKey(today);
  const counts = new Map<string, number>();
  for (const f of followUps) {
    if (f.completed) continue;
    counts.set(dueKey(f), (counts.get(dueKey(f)) ?? 0) + 1);
  }
  return WEEKDAYS.map((label, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const key = localDateKey(d);
    return { label, day: d.getDate(), key, count: counts.get(key) ?? 0, isToday: key === todayKey };
  });
}

export function isoWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
}

export function overdueLabel(dueDate: string, today: Date): string {
  const [y, m, d] = dueDate.slice(0, 10).split('-').map(Number);
  const due = new Date(y, m - 1, d);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((start.getTime() - due.getTime()) / DAY_MS);
  if (days <= 0) return 'Today';
  return `${days} ${days === 1 ? 'day' : 'days'} overdue`;
}

export function winRatePct({ won, lost }: { won: number; lost: number }): number | null {
  const closed = won + lost;
  return closed === 0 ? null : Math.round((won / closed) * 100);
}
