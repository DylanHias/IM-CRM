'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Activity, FollowUp, TimelineEvent } from '@/types/entities';
import { TimelineItem } from './TimelineItem';

const PAGE_SIZE = 10;

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

  const events: TimelineEvent[] = useMemo(() => {
    const all: TimelineEvent[] = [
      ...activities.map((a) => ({ kind: 'activity' as const, ...a })),
      ...followUps.map((f) => ({ kind: 'followup' as const, ...f })),
    ];
    return all.sort((a, b) => getEventDate(b).localeCompare(getEventDate(a)));
  }, [activities, followUps]);

  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleEvents = paginate
    ? events.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
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
        {/* Vertical timeline line — starts at first icon center, ends at last icon center */}
        <div className="absolute left-[34px] top-[32px] bottom-[32px] w-px bg-border/60" />
        {visibleEvents.map((event, i) => (
          <motion.div
            key={`${event.kind}-${event.id}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4), ease: 'easeOut' }}
          >
            <TimelineItem
              event={event}
              onEdit={event.kind === 'activity' && onEditActivity ? () => onEditActivity(event) : undefined}
              onDelete={event.kind === 'activity' && onDeleteActivity ? () => onDeleteActivity(event) : undefined}
            />
          </motion.div>
        ))}
      </div>

      {paginate && totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, events.length)} of {events.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
