'use client';

import { useMemo } from 'react';
import type { Activity, Training, FollowUp, TimelineEvent } from '@/types/entities';
import { TimelineItem } from './TimelineItem';

interface TimelineProps {
  activities: Activity[];
  trainings: Training[];
  followUps: FollowUp[];
}

function getEventDate(event: TimelineEvent): string {
  if (event.kind === 'activity') return event.occurredAt;
  if (event.kind === 'training') return event.trainingDate;
  return event.dueDate;
}

export function Timeline({ activities, trainings, followUps }: TimelineProps) {
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
    <div className="relative">
      <div className="absolute left-[18px] top-0 bottom-0 w-px bg-border" />
      <div className="space-y-0">
        {events.map((event, i) => (
          <TimelineItem key={`${event.kind}-${event.id}`} event={event} isLast={i === events.length - 1} />
        ))}
      </div>
    </div>
  );
}
