import { Badge } from '@/components/ui/badge';
import { relativeExpiration } from '@/lib/opportunities/display';
import { cn } from '@/lib/utils';
import type { Opportunity } from '@/types/entities';

const TONE: Record<string, string> = {
  overdue: 'text-destructive',
  soon: 'text-warning',
  near: 'text-foreground-2',
  neutral: 'text-muted-foreground',
};

/** Expiry as relative text ("in 5d", "3d overdue"), coloured by urgency. */
export function ExpiryLabel({ date, className }: { date: string | null; className?: string }) {
  const exp = relativeExpiration(date);
  if (!exp) return null;
  return <span className={cn('whitespace-nowrap text-[11.5px] tabular-nums', TONE[exp.tone], exp.tone === 'overdue' && 'font-semibold', className)}>{exp.label}</span>;
}

export function OpportunityStatusBadge({ status }: { status: Opportunity['status'] }) {
  if (status === 'Won') return <Badge variant="success">Won</Badge>;
  if (status === 'Lost') return <Badge variant="destructive">Lost</Badge>;
  return <Badge variant="purple">Open</Badge>;
}
