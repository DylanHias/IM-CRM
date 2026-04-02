'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TablePagination } from '@/components/ui/TablePagination';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import type { Activity, FollowUp, TimelineEvent } from '@/types/entities';
import { TimelineItem } from './TimelineItem';

interface TimelineProps {
  activities: Activity[];
  followUps: FollowUp[];
  paginate?: boolean;
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activity: Activity) => void;
}

function getEventDate(event: TimelineEvent): string {
  if (event.kind === 'activity') return event.occurredAt;
  return event.dueDate;
}

export function Timeline({ activities, followUps, paginate, onEditActivity, onDeleteActivity }: TimelineProps) {
  const [page, setPage] = useState(1);
  const { pageSize, setPageSize, pageSizeOptions } = usePaginationPreference('timeline');

  const events: TimelineEvent[] = useMemo(() => {
    const all: TimelineEvent[] = [
      ...activities.map((a) => ({ kind: 'activity' as const, ...a })),
      ...followUps.map((f) => ({ kind: 'followup' as const, ...f })),
    ];
    return all.sort((a, b) => getEventDate(b).localeCompare(getEventDate(a)));
  }, [activities, followUps]);

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
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4), ease: 'easeOut' }}
          >
            <TimelineItem
              event={event}
              isLast={i === visibleEvents.length - 1}
              onEdit={event.kind === 'activity' && onEditActivity ? () => onEditActivity(event) : undefined}
              onDelete={event.kind === 'activity' && onDeleteActivity ? () => onDeleteActivity(event) : undefined}
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
