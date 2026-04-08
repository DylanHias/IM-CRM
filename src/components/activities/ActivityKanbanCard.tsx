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
import { cn } from '@/lib/utils';
import { ACTIVITY_ICONS } from './ActivityItem';
import { formatDate } from '@/lib/utils/dateUtils';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import type { Activity } from '@/types/entities';

interface ActivityKanbanCardProps {
  activity: Activity;
  contactName?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function ActivityKanbanCard({ activity, contactName, onEdit, onDelete }: ActivityKanbanCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const config = ACTIVITY_ICONS[activity.type];
  const Icon = config.icon;

  return (
    <KanbanBoardCard data={{ id: activity.id }}>
      <KanbanBoardCardButtonGroup style={confirmOpen ? { display: 'flex' } : undefined}>
        <KanbanBoardCardButton
          tooltip="Edit"
          className="h-6 w-6 bg-muted/50 text-muted-foreground border-0 hover:bg-primary/10 hover:text-primary hover:cursor-pointer transition-all duration-150 active:scale-95"
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
              className="h-6 w-6 rounded-md inline-flex items-center justify-center text-muted-foreground bg-muted/50 hover:bg-destructive/10 hover:text-destructive transition-all duration-150 active:scale-95 cursor-pointer"
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

      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-2 flex-wrap" data-testid="activity-card-header">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgClass}`}>
            <Icon size={11} className={config.colorClass} />
          </div>
          <Badge variant="outline" className="text-xs capitalize">
            {activity.type === 'call' && activity.direction ? `${activity.direction} ${config.label}` : config.label}
          </Badge>
          {contactName && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className={`text-xs ${config.colorClass}`}>{contactName}</span>
            </>
          )}
          {activity.syncStatus === 'pending' && (
            <Badge variant="warning" className="text-xs gap-1">
              <Clock size={10} />
            </Badge>
          )}
          {activity.syncStatus === 'error' && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertCircle size={10} />
            </Badge>
          )}
        </div>

        <KanbanBoardCardTitle className="mt-1">{activity.subject}</KanbanBoardCardTitle>

        {activity.description && (
          <KanbanBoardCardDescription className="line-clamp-2 text-muted-foreground">
            {activity.description}
          </KanbanBoardCardDescription>
        )}

        <div className="flex items-center justify-between mt-auto pt-1.5 text-xs text-muted-foreground">
          <span className="truncate">{formatDisplayName(activity.createdByName)}</span>
          <span className="flex-shrink-0">{formatDate(activity.occurredAt)}</span>
        </div>
      </div>
    </KanbanBoardCard>
  );
}
