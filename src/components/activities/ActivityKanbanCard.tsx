'use client';

import { useState } from 'react';
import { Clock, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import {
  KanbanBoardCard,
  KanbanBoardCardTitle,
  KanbanBoardCardDescription,
  KanbanBoardCardButtonGroup,
  KanbanBoardCardButton,
} from '@/components/kanban';
import { ACTIVITY_ICONS } from './ActivityItem';
import { formatDate } from '@/lib/utils/dateUtils';
import type { Activity } from '@/types/entities';

interface ActivityKanbanCardProps {
  activity: Activity;
  contactName?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function ActivityKanbanCard({ activity, contactName, onEdit, onDelete }: ActivityKanbanCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const config = ACTIVITY_ICONS[activity.type];
  const Icon = config.icon;

  return (
    <KanbanBoardCard data={{ id: activity.id }}>
      <KanbanBoardCardButtonGroup>
        <KanbanBoardCardButton
          tooltip="Edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil size={12} />
        </KanbanBoardCardButton>
        <ConfirmPopover
          message={`Delete "${activity.subject}"?`}
          confirmLabel="Delete"
          onConfirm={onDelete}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        >
          <KanbanBoardCardButton
            className="text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOpen(true);
            }}
          >
            <Trash2 size={12} />
          </KanbanBoardCardButton>
        </ConfirmPopover>
      </KanbanBoardCardButtonGroup>

      <div className="flex items-center gap-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgClass}`}>
          <Icon size={11} className={config.colorClass} />
        </div>
        <Badge variant="outline" className="text-xs capitalize">
          {activity.type === 'call' && activity.direction ? `${activity.direction} ${config.label}` : config.label}
        </Badge>
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

      {contactName && (
        <Badge variant="secondary" className="mt-1 text-xs font-normal truncate max-w-full">
          {contactName}
        </Badge>
      )}

      <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
        <span className="truncate">{activity.createdByName}</span>
        <span className="flex-shrink-0">{formatDate(activity.occurredAt)}</span>
      </div>
    </KanbanBoardCard>
  );
}
