import type { Opportunity } from '@/types/entities';

export type ExpiryTone = 'overdue' | 'soon' | 'near' | 'neutral';

/** "4d overdue", "today", "in 12d" plus a tone for colouring, or null without a valid date. */
export function relativeExpiration(dateStr: string | null, today: Date = new Date()): { label: string; tone: ExpiryTone } | null {
  if (!dateStr) return null;
  const target = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const t = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((t.getTime() - start.getTime()) / 86_400_000);
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, tone: 'overdue' };
  if (diffDays === 0) return { label: 'today', tone: 'soon' };
  if (diffDays <= 7) return { label: `in ${diffDays}d`, tone: 'soon' };
  if (diffDays <= 30) return { label: `in ${diffDays}d`, tone: 'near' };
  return { label: `in ${diffDays}d`, tone: 'neutral' };
}

/** An opportunity's ARR: annual revenue, falling back to estimated revenue on older rows. */
export function oppArr(o: Pick<Opportunity, 'annualRevenue' | 'estimatedRevenue'>): number | null {
  return o.annualRevenue ?? o.estimatedRevenue;
}

export function weightedValue(o: Pick<Opportunity, 'annualRevenue' | 'estimatedRevenue' | 'probability'>): number {
  return ((oppArr(o) ?? 0) * o.probability) / 100;
}

/** Compact money for lists and boards: €1.2M, €84K. */
export function compactMoney(value: number | null, currency: string | null = 'EUR'): string {
  if (value === null) return '—';
  const sym = currency === 'USD' ? '$' : currency === 'EUR' || !currency ? '€' : `${currency} `;
  if (Math.abs(value) >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${sym}${Math.round(value / 1_000)}K`;
  return `${sym}${Math.round(value)}`;
}
