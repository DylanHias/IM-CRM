'use client';

import { useMemo } from 'react';
import {
  KanbanBoardProvider,
  KanbanBoard,
  KanbanBoardColumn,
  KanbanBoardColumnHeader,
  KanbanBoardColumnTitle,
  KanbanBoardColumnList,
  KanbanBoardColumnListItem,
} from '@/components/kanban';
import { STATUS_CONFIG } from './ActivityItem';
import { ActivityKanbanCard } from './ActivityKanbanCard';
import type { Activity, ActivityStatus, Contact } from '@/types/entities';

interface ActivityKanbanBoardProps {
  activities: Activity[];
  contacts: Contact[];
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onStatusChange: (activity: Activity, newStatus: ActivityStatus) => void;
}

const COLUMNS: ActivityStatus[] = ['open', 'completed', 'rejected', 'expired'];

export function ActivityKanbanBoard({ activities, contacts, onEdit, onDelete, onStatusChange }: ActivityKanbanBoardProps) {
  const grouped = useMemo(() => {
    const map: Record<ActivityStatus, Activity[]> = { open: [], completed: [], rejected: [], expired: [] };
    for (const a of activities) {
      map[a.activityStatus].push(a);
    }
    for (const status of COLUMNS) {
      map[status].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    }
    return map;
  }, [activities]);

  const contactMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of contacts) {
      m.set(c.id, `${c.firstName} ${c.lastName}`);
    }
    return m;
  }, [contacts]);

  const handleDrop = (columnId: string) => (dataTransferData: string) => {
    const parsed = JSON.parse(dataTransferData) as { id: string };
    const activity = activities.find((a) => a.id === parsed.id);
    if (!activity) return;
    const newStatus = columnId as ActivityStatus;
    if (activity.activityStatus !== newStatus) {
      onStatusChange(activity, newStatus);
    }
  };

  return (
    <KanbanBoardProvider>
      <KanbanBoard className="pb-2">
        {COLUMNS.map((status) => {
          const config = STATUS_CONFIG[status];
          const StatusIcon = config.icon;
          const items = grouped[status];

          return (
            <KanbanBoardColumn
              key={status}
              columnId={status}
              onDropOverColumn={handleDrop(status)}
              className="min-w-[220px] flex-1"
            >
              <KanbanBoardColumnHeader>
                <KanbanBoardColumnTitle columnId={status}>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${config.className} px-2 py-0.5 rounded-full border`}>
                    <StatusIcon size={12} />
                    {config.label}
                    <span className="text-[10px] opacity-70">({items.length})</span>
                  </span>
                </KanbanBoardColumnTitle>
              </KanbanBoardColumnHeader>

              <KanbanBoardColumnList className="px-1">
                {items.map((activity) => (
                  <KanbanBoardColumnListItem key={activity.id} cardId={activity.id}>
                    <ActivityKanbanCard
                      activity={activity}
                      contactName={activity.contactId ? contactMap.get(activity.contactId) : undefined}
                      onEdit={() => onEdit(activity)}
                      onDelete={() => onDelete(activity)}
                    />
                  </KanbanBoardColumnListItem>
                ))}
              </KanbanBoardColumnList>
            </KanbanBoardColumn>
          );
        })}
      </KanbanBoard>
    </KanbanBoardProvider>
  );
}
