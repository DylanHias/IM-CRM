'use client';

import { useRouter } from 'next/navigation';
import { ArrowUpRight, ArrowDownLeft, Crosshair, Clock } from 'lucide-react';
import { useCustomerStore } from '@/store/customerStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ACTIVITY_ICONS, STATUS_CONFIG } from '@/components/activities/ActivityItem';
import type { Activity, Opportunity } from '@/types/entities';

const BORDER_COLOR: Record<Activity['type'], string> = {
  meeting: 'border-l-activity-meeting',
  visit:   'border-l-activity-visit',
  call:    'border-l-activity-call',
  note:    'border-l-activity-note',
};

type FeedItem =
  | { kind: 'activity'; sortAt: string; data: Activity }
  | { kind: 'opportunity'; sortAt: string; data: Opportunity };

interface Props {
  activities: Activity[];
  opportunities?: Opportunity[];
  loading: boolean;
  limit?: number;
}

export function RecentActivityPanel({ activities, opportunities = [], loading, limit = 15 }: Props) {
  const router = useRouter();
  const customers = useCustomerStore((s) => s.customers);
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? '';

  const feed: FeedItem[] = [
    ...activities.map<FeedItem>((a) => ({ kind: 'activity', sortAt: a.occurredAt, data: a })),
    ...opportunities.map<FeedItem>((o) => ({ kind: 'opportunity', sortAt: o.updatedAt, data: o })),
  ]
    .sort((a, b) => (a.sortAt < b.sortAt ? 1 : -1))
    .slice(0, limit);

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-border/50 shrink-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Activity
        </p>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          Last 15
        </span>
      </div>

      {/* Scrollable list */}
      <div className="overflow-y-auto flex-1 min-h-0">
        {loading ? (
          <ul className="divide-y divide-border/60">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-2.5 px-4 py-3">
                <Skeleton className="w-7 h-7 rounded-md shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4 rounded" />
                  <Skeleton className="h-2.5 w-1/2 rounded" />
                </div>
                <Skeleton className="h-4 w-12 rounded shrink-0" />
              </li>
            ))}
          </ul>
        ) : feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
            <p className="text-sm text-muted-foreground">No activity yet.</p>
            <button
              onClick={() => router.push('/customers')}
              className="text-xs text-primary hover:underline"
            >
              Go to a customer to add one
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {feed.map((item) => {
              if (item.kind === 'activity') {
                const a = item.data;
                const typeConfig = ACTIVITY_ICONS[a.type] ?? ACTIVITY_ICONS.note;
                const statusConfig = STATUS_CONFIG[a.activityStatus];
                const Icon = typeConfig.icon;
                const StatusIcon = statusConfig.icon;
                const borderClass = BORDER_COLOR[a.type] ?? 'border-l-muted';
                const occurred = new Date(a.occurredAt).toLocaleDateString('en-BE', {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <li
                    key={`a-${a.id}`}
                    className={cn(
                      'flex items-center gap-2.5 px-4 py-3 cursor-pointer',
                      'border-l-2 border-l-transparent',
                      borderClass,
                      'hover:bg-accent/40 transition-colors',
                    )}
                    onClick={() => router.push(`/customers?id=${a.customerId}&tab=activities`)}
                  >
                    <div className={cn(
                      'shrink-0 w-7 h-7 rounded-md flex items-center justify-center',
                      typeConfig.bgClass,
                    )}>
                      <Icon size={13} className={typeConfig.colorClass} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">{a.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">{customerName(a.customerId)}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] px-1.5 py-0 h-4 gap-0.5 font-medium', statusConfig.className)}
                      >
                        <StatusIcon size={8} />
                        {statusConfig.label}
                      </Badge>
                      <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        {a.type === 'call' && a.direction === 'outgoing' && <ArrowUpRight size={9} />}
                        {a.type === 'call' && a.direction === 'incoming' && <ArrowDownLeft size={9} />}
                        {occurred}
                      </div>
                    </div>
                  </li>
                );
              }

              const o = item.data;
              const updated = new Date(o.updatedAt).toLocaleDateString('en-BE', {
                month: 'short',
                day: 'numeric',
              });
              const pending = o.syncStatus === 'pending';

              return (
                <li
                  key={`o-${o.id}`}
                  className={cn(
                    'flex items-center gap-2.5 px-4 py-3 cursor-pointer',
                    'border-l-2 border-l-transparent border-l-primary/60',
                    'hover:bg-accent/40 transition-colors',
                  )}
                  onClick={() => router.push(`/customers?id=${o.customerId}&tab=opportunities`)}
                >
                  <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-primary/10">
                    <Crosshair size={13} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate leading-tight">{o.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{customerName(o.customerId)}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] px-1.5 py-0 h-4 gap-0.5 font-medium',
                        pending
                          ? 'bg-warning/10 text-warning border-warning/40'
                          : 'bg-primary/10 text-primary border-primary/40',
                      )}
                    >
                      {pending ? <Clock size={8} /> : <Crosshair size={8} />}
                      {pending ? 'Pending' : o.stage}
                    </Badge>
                    <div className="text-[10px] text-muted-foreground">{updated}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
