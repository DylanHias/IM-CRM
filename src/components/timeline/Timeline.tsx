'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Activity, Training, FollowUp, TimelineEvent } from '@/types/entities';
import { TimelineItem } from './TimelineItem';

interface TimelineProps {
  activities: Activity[];
  trainings: Training[];
  followUps: FollowUp[];
  onEditActivity?: (activity: Activity) => void;
  onDeleteActivity?: (activity: Activity) => void;
}

function getEventDate(event: TimelineEvent): string {
  if (event.kind === 'activity') return event.occurredAt;
  if (event.kind === 'training') return event.trainingDate;
  return event.dueDate;
}

export function Timeline({ activities, trainings, followUps, onEditActivity, onDeleteActivity }: TimelineProps) {
  const events: TimelineEvent[] = useMemo(() => {
    const all: TimelineEvent[] = [
      ...activities.map((a) => ({ kind: 'activity' as const, ...a })),
      ...trainings.map((t) => ({ kind: 'training' as const, ...t })),
      ...followUps.map((f) => ({ kind: 'followup' as const, ...f })),
    ];
    return all.sort((a, b) => getEventDate(b).localeCompare(getEventDate(a)));
  }, [activities, trainings, followUps]);

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No events in the timeline yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Log activities and add follow-ups to get started.</p>
      </div>
    );
  }

  return (
    <div className="relative bg-card border border-border/70 rounded-xl overflow-hidden shadow-sm">
      {/* Vertical timeline line — starts at first icon center, ends at last icon center */}
      <div className="absolute left-[34px] top-[32px] bottom-[32px] w-px bg-border/60" />
      {events.map((event, i) => (
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
  );
}
