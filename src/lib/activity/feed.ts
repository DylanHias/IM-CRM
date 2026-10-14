import type { Activity, FollowUp, Opportunity, TimelineEvent } from '@/types/entities';

const DAY_MS = 86_400_000;

export function eventDate(event: TimelineEvent): string {
  if (event.kind === 'activity') return event.occurredAt;
  if (event.kind === 'followup') return event.dueDate;
  return event.expirationDate ?? event.createdAt;
}

/** All events of the three kinds in one list, newest first. */
export function buildFeed(activities: Activity[], followUps: FollowUp[], opportunities: Opportunity[]): TimelineEvent[] {
  return [
    ...activities.map((a) => ({ kind: 'activity' as const, ...a })),
    ...followUps.map((f) => ({ kind: 'followup' as const, ...f })),
    ...opportunities.map((o) => ({ kind: 'opportunity' as const, ...o })),
  ].sort((a, b) => eventDate(b).localeCompare(eventDate(a)));
}

const toLocalDate = (iso: string) => (iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso));

/** "Today", "Yesterday", "Fri 2 Oct", or with the year when it isn't this year. */
export function dayLabel(iso: string, today: Date = new Date()): string {
  const d = toLocalDate(iso);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (day === start) return 'Today';
  if (day === start - DAY_MS) return 'Yesterday';
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  if (d.getFullYear() !== today.getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-GB', opts).replace(',', '');
}

export function groupByDay(events: TimelineEvent[], today: Date = new Date()): { label: string; events: TimelineEvent[] }[] {
  const groups: { label: string; events: TimelineEvent[] }[] = [];
  for (const e of events) {
    const label = dayLabel(eventDate(e), today);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.events.push(e);
    else groups.push({ label, events: [e] });
  }
  return groups;
}

export function matchesFeedQuery(event: TimelineEvent, query: string, customerNames: Map<string, string>): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const text = event.kind === 'followup' ? event.title : event.subject;
  return text.toLowerCase().includes(q) || (customerNames.get(event.customerId) ?? '').toLowerCase().includes(q);
}
