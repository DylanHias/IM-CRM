'use client';

import { useState } from 'react';
import { Clock, AlertCircle, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import {
  KanbanBoardCard,
  KanbanBoardCardTitle,
  KanbanBoardCardDescription,
  KanbanBoardCardButtonGroup,
  KanbanBoardCardButton,
} from '@/components/kanban';
import { ACTIVITY_ICONS } from './ActivityItem';
import { ActivityTypeIcon } from './ActivityTypeIcon';
import { formatDate } from '@/lib/utils/dateUtils';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import { stripHtml } from '@/lib/utils/htmlUtils';
import { cn } from '@/lib/utils';
import type { Activity } from '@/types/entities';

interface ActivityKanbanCardProps {
  activity: Activity;
  contactName?: string;
  onEdit: () => void;
  onDelete: () => void;
  onPreview?: () => void;
}

export function ActivityKanbanCard({ activity, contactName, onEdit, onDelete, onPreview }: ActivityKanbanCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const config = ACTIVITY_ICONS[activity.type];
  const isTerminal = activity.activityStatus === 'completed' || activity.activityStatus === 'rejected' || activity.activityStatus === 'expired';

  return (
    <KanbanBoardCard
      data={{ id: activity.id }}
      draggable={!isTerminal}
      className={cn(
        'gap-1 rounded-[calc(var(--radius)*1.5)] border-border bg-card p-2.5 shadow-none transition-colors hover:border-border-strong',
        isTerminal && 'cursor-pointer',
      )}
      onClick={onPreview}
    >
      <KanbanBoardCardButtonGroup
        className="right-2 top-2 rounded-md bg-card"
        style={confirmOpen ? { display: 'flex' } : undefined}
      >
        <KanbanBoardCardButton
          tooltip="Edit"
          aria-label="Edit"
          className="size-6 border-0 text-muted-foreground transition-colors hover:cursor-pointer hover:bg-sunken hover:text-foreground active:scale-95"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil size={11} />
        </KanbanBoardCardButton>
        <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
          <PopoverTrigger asChild>
            <div
              role="button"
              tabIndex={-1}
              aria-label="Delete"
              className="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Trash2 size={11} />
            </div>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" className="w-64">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-[13px] leading-snug">Delete &ldquo;{activity.subject}&rdquo;?</p>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={() => {
                  setConfirmOpen(false);
                  onDelete();
                }}
              >
                Delete
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </KanbanBoardCardButtonGroup>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5 pr-14" data-testid="activity-card-header">
          <ActivityTypeIcon type={activity.type} size="sm" />
          <Badge variant="secondary" className="capitalize">
            {activity.type === 'call' && activity.direction ? `${activity.direction} ${config.label}` : config.label}
          </Badge>
          {contactName && (
            <>
              <span className="text-[11.5px] text-faint">·</span>
              <span className={cn('truncate text-[11.5px]', config.colorClass)}>{contactName}</span>
            </>
          )}
          {activity.syncStatus === 'pending' && (
            <Badge variant="warning" title="Pending sync">
              <Clock size={10} />
            </Badge>
          )}
          {activity.syncStatus === 'error' && (
            <Badge variant="destructive" title="Sync error">
              <AlertCircle size={10} />
            </Badge>
          )}
        </div>

        <KanbanBoardCardTitle className="text-[13px] font-[550] leading-snug">{activity.subject}</KanbanBoardCardTitle>

        {activity.description && (
          <KanbanBoardCardDescription className="line-clamp-2 whitespace-normal text-[12.5px] leading-[1.45] text-muted-foreground">
            {stripHtml(activity.description)}
          </KanbanBoardCardDescription>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-[11.5px] text-muted-foreground">
          <span className="truncate">{formatDisplayName(activity.createdByName)}</span>
          <span className="flex-shrink-0 tabular-nums">{formatDate(activity.occurredAt)}</span>
        </div>
      </div>
    </KanbanBoardCard>
  );
}
