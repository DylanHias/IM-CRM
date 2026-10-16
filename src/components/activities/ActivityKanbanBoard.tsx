'use client';

import { useMemo, useState } from 'react';
import { Ban, CheckCircle2, ChevronLeft, Clock, type LucideIcon } from 'lucide-react';
import {
  KanbanBoardProvider,
  KanbanBoard,
  KanbanBoardColumn,
  KanbanBoardColumnHeader,
  KanbanBoardColumnTitle,
  KanbanBoardColumnList,
  KanbanBoardColumnListItem,
} from '@/components/kanban';
import { badgeVariants, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ActivityKanbanCard } from './ActivityKanbanCard';
import type { Activity, ActivityStatus, Contact } from '@/types/entities';

interface ActivityKanbanBoardProps {
  activities: Activity[];
  contacts: Contact[];
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onStatusChange: (activity: Activity, newStatus: ActivityStatus) => void;
  onPreview?: (activity: Activity) => void;
}

type KanbanColumn = 'open' | 'completed' | 'cancelled';

const COLUMNS: KanbanColumn[] = ['open', 'completed', 'cancelled'];

interface ColumnConfig {
  label: string;
  icon: LucideIcon;
  variant: NonNullable<BadgeProps['variant']>;
}

const COLUMN_CONFIG: Record<KanbanColumn, ColumnConfig> = {
  open: { label: 'Open', icon: Clock, variant: 'info' },
  completed: { label: 'Completed', icon: CheckCircle2, variant: 'success' },
  cancelled: { label: 'Cancelled', icon: Ban, variant: 'destructive' },
};

const COLUMN_BASE = 'rounded-[calc(var(--radius)*1.5)] border-border bg-surface-2 py-1.5';

export function ActivityKanbanBoard({ activities, contacts, onEdit, onDelete, onStatusChange, onPreview }: ActivityKanbanBoardProps) {
  const [manualCollapsed, setManualCollapsed] = useState<Set<KanbanColumn>>(new Set());
  const [manualExpanded, setManualExpanded] = useState<Set<KanbanColumn>>(new Set());

  const grouped = useMemo(() => {
    const map: Record<KanbanColumn, Activity[]> = { open: [], completed: [], cancelled: [] };
    for (const a of activities) {
      const col: KanbanColumn = a.activityStatus === 'rejected' || a.activityStatus === 'expired' ? 'cancelled' : a.activityStatus;
      map[col].push(a);
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

  const isCollapsed = (status: KanbanColumn) => {
    if (manualCollapsed.has(status)) return true;
    if (manualExpanded.has(status)) return false;
    return grouped[status].length === 0;
  };

  const toggleCollapse = (status: KanbanColumn) => {
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
    const col = columnId as KanbanColumn;
    const newStatus: ActivityStatus = col === 'cancelled' ? 'rejected' : col;
    // D365 forbids transitioning a completed activity to cancelled — only open is allowed
    if (activity.activityStatus === 'completed' && col === 'cancelled') return;
    if (activity.activityStatus !== newStatus) {
      if (isCollapsed(col)) {
        setManualExpanded((prev) => new Set(prev).add(col));
        setManualCollapsed((prev) => { const next = new Set(prev); next.delete(col); return next; });
      }
      onStatusChange(activity, newStatus);
    }
  };

  return (
    <KanbanBoardProvider>
      <KanbanBoard className="pb-2">
        {COLUMNS.map((status) => {
          const config = COLUMN_CONFIG[status];
          const StatusIcon = config.icon;
          const items = grouped[status];
          const collapsed = isCollapsed(status);

          if (collapsed) {
            return (
              <KanbanBoardColumn
                key={status}
                columnId={status}
                onDropOverColumn={handleDrop(status)}
                className={cn(COLUMN_BASE, 'w-10 min-w-[40px] flex-shrink-0 flex-grow-0 cursor-pointer transition-colors hover:border-border-strong')}
                onClick={() => toggleCollapse(status)}
                title={`Expand ${config.label}`}
              >
                <div className="flex flex-col items-center gap-2 py-1">
                  <span className={cn(badgeVariants({ variant: config.variant }), 'size-6 justify-center px-0 tabular-nums')}>
                    {items.length}
                  </span>
                  <span
                    id={`column-${status}-title`}
                    className="text-[11.5px] font-medium text-muted-foreground [text-orientation:mixed] [writing-mode:vertical-rl]"
                  >
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
              className={cn(COLUMN_BASE, 'min-w-[200px] flex-1')}
            >
              <KanbanBoardColumnHeader className="gap-2 px-2 pb-1.5 pt-0.5">
                <KanbanBoardColumnTitle columnId={status}>
                  <span className={badgeVariants({ variant: config.variant })}>
                    <StatusIcon size={11} />
                    {config.label} <span className="tabular-nums opacity-75">({items.length})</span>
                  </span>
                </KanbanBoardColumnTitle>
                <button
                  type="button"
                  onClick={() => toggleCollapse(status)}
                  className="ml-auto grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-sunken hover:text-foreground"
                  aria-label={`Collapse ${config.label} column`}
                  title={`Collapse ${config.label}`}
                >
                  <ChevronLeft size={13} />
                </button>
              </KanbanBoardColumnHeader>

              <KanbanBoardColumnList className="stagger-in px-0.5">
                {items.map((activity) => (
                  <KanbanBoardColumnListItem key={activity.id} cardId={activity.id} className="px-1.5 py-[3px]">
                    <ActivityKanbanCard
                      activity={activity}
                      contactName={activity.contactId ? contactMap.get(activity.contactId) : undefined}
                      onEdit={() => onEdit(activity)}
                      onDelete={() => onDelete(activity)}
                      onPreview={onPreview ? () => onPreview(activity) : undefined}
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
