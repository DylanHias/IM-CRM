'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [manualCollapsed, setManualCollapsed] = useState<Set<ActivityStatus>>(new Set());
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

  const isCollapsed = (status: ActivityStatus) => {
    if (manualCollapsed.has(status)) return true;
    if (manualExpanded.has(status)) return false;
    return grouped[status].length === 0;
  };

  const toggleCollapse = (status: ActivityStatus) => {
    if (isCollapsed(status)) {
      setManualExpanded((prev) => new Set(prev).add(status));
      setManualCollapsed((prev) => { const next = new Set(prev); next.delete(status); return next; });
    } else {
      setManualCollapsed((prev) => new Set(prev).add(status));
      setManualExpanded((prev) => { const next = new Set(prev); next.delete(status); return next; });
    }
  };

  const handleDrop = (columnId: string) => (dataTransferData: string) => {
    const parsed = JSON.parse(dataTransferData) as { id: string };
    const activity = activities.find((a) => a.id === parsed.id);
    if (!activity) return;
    const newStatus = columnId as ActivityStatus;
    if (activity.activityStatus !== newStatus) {
      if (isCollapsed(newStatus)) {
        setManualExpanded((prev) => new Set(prev).add(newStatus));
        setManualCollapsed((prev) => { const next = new Set(prev); next.delete(newStatus); return next; });
      }
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
          const collapsed = isCollapsed(status);

          if (collapsed) {
            return (
              <KanbanBoardColumn
                key={status}
                columnId={status}
                onDropOverColumn={handleDrop(status)}
                className="w-10 min-w-[40px] flex-shrink-0 flex-grow-0 cursor-pointer"
                onClick={() => toggleCollapse(status)}
              >
                <div className="flex flex-col items-center gap-2 py-2">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold ${config.className}`}>
                    {items.length}
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
                <button
                  type="button"
                  onClick={() => toggleCollapse(status)}
                  className="ml-auto p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Collapse ${config.label} column`}
                >
                  <ChevronLeft size={14} />
                </button>
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
