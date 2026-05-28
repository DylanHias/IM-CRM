'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock } from 'lucide-react';
import { useCustomerStore } from '@/store/customerStore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { FollowUp } from '@/types/entities';

interface Props {
  followUps: FollowUp[];
  loading: boolean;
}

interface DayBucket {
  date: string;
  weekday: string;
  dayNum: number;
  isToday: boolean;
  items: FollowUp[];
}

function buildBuckets(followUps: FollowUp[]): DayBucket[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets: DayBucket[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split('T')[0];
    return {
      date: iso,
      weekday: d.toLocaleDateString('en-BE', { weekday: 'short' }),
      dayNum: d.getDate(),
      isToday: i === 0,
      items: [],
    };
  });

  const byDate = new Map(buckets.map((b) => [b.date, b]));
  for (const f of followUps) {
    if (f.completed) continue;
    const bucket = byDate.get(f.dueDate);
    if (bucket) bucket.items.push(f);
  }
  return buckets;
}

export function WeekStripPanel({ followUps, loading }: Props) {
  const router = useRouter();
  const customers = useCustomerStore((s) => s.customers);
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? '';

  const buckets = useMemo(() => buildBuckets(followUps), [followUps]);
  const total = buckets.reduce((s, b) => s + b.items.length, 0);

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <CalendarClock size={13} className="text-primary" />
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Next 7 Days
          </p>
        </div>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {loading ? '—' : total}
        </span>
      </div>

      {loading ? (
        <div className="p-3 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
      ) : (
        <div className="p-3 grid grid-cols-7 gap-1.5">
          {buckets.map((b) => (
            <div
              key={b.date}
              className={cn(
                'rounded-md border flex flex-col min-h-[96px] overflow-hidden',
                b.isToday
                  ? 'border-primary/60 bg-primary/5'
                  : 'border-border/60 bg-muted/30',
              )}
            >
              <div
                className={cn(
                  'px-1.5 py-1 text-center border-b shrink-0',
                  b.isToday ? 'border-primary/40 bg-primary/10' : 'border-border/40',
                )}
              >
                <p
                  className={cn(
                    'text-[9px] uppercase font-semibold tracking-wider leading-tight',
                    b.isToday ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {b.weekday}
                </p>
                <p
                  className={cn(
                    'text-sm font-semibold tabular-nums leading-tight',
                    b.isToday ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {b.dayNum}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-1 space-y-1">
                {b.items.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-[9px] text-muted-foreground/50">—</span>
                  </div>
                ) : (
                  b.items.slice(0, 3).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() =>
                        router.push(`/customers?id=${f.customerId}&tab=follow-ups`)
                      }
                      className={cn(
                        'w-full text-left rounded px-1 py-0.5',
                        'hover:bg-accent/60 transition-colors',
                        b.isToday ? 'bg-primary/15' : 'bg-background',
                      )}
                      title={`${f.title} — ${customerName(f.customerId)}`}
                    >
                      <p className="text-[10px] font-medium truncate leading-tight">{f.title}</p>
                      <p className="text-[9px] text-muted-foreground truncate leading-tight">
                        {customerName(f.customerId)}
                      </p>
                    </button>
                  ))
                )}
                {b.items.length > 3 && (
                  <p className="text-[9px] text-muted-foreground text-center pt-0.5">
                    +{b.items.length - 3} more
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
