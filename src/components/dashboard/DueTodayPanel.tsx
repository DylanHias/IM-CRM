'use client';

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

export function DueTodayPanel({ followUps, loading }: Props) {
  const router = useRouter();
  const customers = useCustomerStore((s) => s.customers);
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? '';

  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-border/50 shrink-0">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Due Today
        </p>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {loading ? '—' : followUps.length}
        </span>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 min-h-0 max-h-[520px]">
        {loading ? (
          <ul className="divide-y divide-border/60">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-2.5 px-4 py-3">
                <Skeleton className="w-7 h-7 rounded-md shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4 rounded" />
                  <Skeleton className="h-2.5 w-1/2 rounded" />
                </div>
              </li>
            ))}
          </ul>
        ) : followUps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-2">
            <p className="text-sm text-muted-foreground">Nothing due today.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {followUps.map((f) => (
              <li
                key={f.id}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-3 cursor-pointer',
                  'border-l-2 border-l-primary/60',
                  'hover:bg-accent/40 transition-colors',
                )}
                onClick={() => router.push(`/customers?id=${f.customerId}&tab=follow-ups`)}
              >
                <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-primary/10">
                  <CalendarClock size={13} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-tight">{f.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{customerName(f.customerId)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
