import type { SyncRecord } from '@/types/sync';

export interface DaySummary {
  runs: number;
  successRate: number | null;
  errors: number;
  partial: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Finished sync runs from the 24 hours before `now`, with the share that fully succeeded. */
export function summarizeLastDay(records: SyncRecord[], now: Date = new Date()): DaySummary {
  const since = now.getTime() - DAY_MS;
  const recent = records.filter((r) => r.status !== 'running' && new Date(r.startedAt).getTime() >= since);
  const ok = recent.filter((r) => r.status === 'success').length;
  return {
    runs: recent.length,
    successRate: recent.length ? Math.round((ok / recent.length) * 100) : null,
    errors: recent.filter((r) => r.status === 'error').length,
    partial: recent.filter((r) => r.status === 'partial').length,
  };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "2 activities · 1 follow-up" — only the kinds with changes waiting. */
export function pendingBreakdown(activities: number, followUps: number, opportunities: number): string {
  const parts = [
    activities ? plural(activities, 'activity', 'activities') : null,
    followUps ? plural(followUps, 'follow-up', 'follow-ups') : null,
    opportunities ? plural(opportunities, 'opportunity', 'opportunities') : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'All changes synced';
}
