'use client';

import { useMemo, useState } from 'react';
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
  const [manualExpanded, setManualExpanded] = useState<Set<ActivityStatus>>(new Set());

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
          const isEmpty = items.length === 0;
          const isCollapsed = isEmpty && !manualExpanded.has(status);

          if (isCollapsed) {
            return (
              <KanbanBoardColumn
                key={status}
                columnId={status}
                onDropOverColumn={(data) => {
                  setManualExpanded((prev) => new Set(prev).add(status));
                  handleDrop(status)(data);
                }}
                className="w-10 min-w-[40px] flex-shrink-0 flex-grow-0 cursor-pointer"
                onClick={() => setManualExpanded((prev) => new Set(prev).add(status))}
              >
                <div className="flex flex-col items-center gap-2 py-2">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold ${config.className}`}>
                    0
                  </span>
                  <span className="text-[11px] text-muted-foreground [writing-mode:vertical-rl] [text-orientation:mixed]">
                    {config.label}
                  </span>
                </div>
              </KanbanBoardColumn>
            );
          }

          return (
            <KanbanBoardColumn
              key={status}
              columnId={status}
              onDropOverColumn={handleDrop(status)}
              className="min-w-[180px] flex-1"
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
