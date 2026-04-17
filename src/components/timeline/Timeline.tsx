'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { rowSlideIn } from '@/lib/motion';
import { TablePagination } from '@/components/ui/TablePagination';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import type { Activity, FollowUp, Opportunity, TimelineEvent } from '@/types/entities';
import { TimelineItem } from './TimelineItem';

interface TimelineProps {
  activities: Activity[];
  followUps: FollowUp[];
  opportunities?: Opportunity[];
  paginate?: boolean;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activity: Activity) => void;
  customerMap?: Map<string, string>;
  onOpenCustomer?: (customerId: string) => void;
}

function getEventDate(event: TimelineEvent): string {
  if (event.kind === 'activity') return event.occurredAt;
  if (event.kind === 'followup') return event.dueDate;
  return event.expirationDate ?? event.createdAt;
}

export function Timeline({ activities, followUps, opportunities, paginate, onEditActivity, onDeleteActivity, customerMap, onOpenCustomer }: TimelineProps) {
  const [page, setPage] = useState(1);
  const { pageSize, setPageSize, pageSizeOptions } = usePaginationPreference('timeline');

  const events: TimelineEvent[] = useMemo(() => {
    const all: TimelineEvent[] = [
      ...activities.map((a) => ({ kind: 'activity' as const, ...a })),
      ...followUps.map((f) => ({ kind: 'followup' as const, ...f })),
      ...(opportunities ?? []).map((o) => ({ kind: 'opportunity' as const, ...o })),
    ];
    return all.sort((a, b) => getEventDate(b).localeCompare(getEventDate(a)));
  }, [activities, followUps, opportunities]);

  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleEvents = paginate
    ? events.slice((safePage - 1) * pageSize, safePage * pageSize)
    : events;

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No events in the timeline yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Log activities and add follow-ups to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative bg-card border border-border/70 rounded-xl overflow-hidden shadow-sm">
        {visibleEvents.map((event, i) => (
          <motion.div
            key={`${event.kind}-${event.id}`}
            {...rowSlideIn(i)}
          >
            <TimelineItem
              event={event}
              isLast={i === visibleEvents.length - 1}
              onEdit={event.kind === 'activity' && onEditActivity ? () => onEditActivity(event) : undefined}
              onDelete={event.kind === 'activity' && onDeleteActivity ? () => onDeleteActivity(event) : undefined}
              customerName={customerMap?.get(event.customerId)}
              onOpenCustomer={onOpenCustomer ? () => onOpenCustomer(event.customerId) : undefined}
            />
          </motion.div>
        ))}
      </div>

      {paginate && totalPages > 1 && (
        <TablePagination
          totalItems={events.length}
          page={safePage}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}
