'use client';

import { CheckSquare, Square, Calendar, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { formatDueDate } from '@/lib/utils/dateUtils';
import type { FollowUp } from '@/types/entities';

interface FollowUpItemProps {
  followUp: FollowUp;
  onComplete?: (id: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function FollowUpItem({ followUp, onComplete, onEdit, onDelete }: FollowUpItemProps) {
  const { label: dueDateLabel, isOverdue } = formatDueDate(followUp.dueDate);

  return (
    <div className={`flex items-start gap-3.5 px-4 py-3.5 group ${followUp.completed ? 'opacity-50' : ''}`}>
      {followUp.completed ? (
        <span className="mt-0.5 flex-shrink-0">
          <CheckSquare size={18} className="text-success" />
        </span>
      ) : (
        <ConfirmPopover
          message={`Mark "${followUp.title}" as complete?`}
          confirmLabel="Complete"
          variant="default"
          onConfirm={() => onComplete?.(followUp.id)}
          side="bottom"
          align="start"
        >
          <button
            className="mt-0.5 flex-shrink-0 text-primary hover:text-primary/80 disabled:cursor-not-allowed"
            disabled={!onComplete}
            title="Mark as complete"
          >
            <Square size={18} />
          </button>
        </ConfirmPopover>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-sm font-medium ${followUp.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {followUp.title}
            </p>
            {followUp.description && (
              <p className="text-[13px] text-muted-foreground mt-0.5">{followUp.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`flex items-center gap-1 text-xs ${isOverdue && !followUp.completed ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                {isOverdue && !followUp.completed && <AlertCircle size={11} />}
                <Calendar size={10} />
                {dueDateLabel}
              </span>
              {followUp.syncStatus === 'pending' && !followUp.completed && (
                <Badge variant="warning" className="text-[10px]">Pending sync</Badge>
              )}
            </div>
          </div>

        </div>
      </div>

      {!followUp.completed && (
        <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          {onEdit && (
            <button
              className="h-6 w-6 rounded-md inline-flex items-center justify-center text-muted-foreground bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all duration-150 active:scale-95"
              onClick={onEdit}
              title="Edit"
            >
              <Pencil size={11} />
            </button>
          )}
          {onDelete && (
            <ConfirmPopover message={`Delete "${followUp.title}"?`} confirmLabel="Delete" onConfirm={onDelete}>
              <button
                className="h-6 w-6 rounded-md inline-flex items-center justify-center text-muted-foreground bg-muted/50 hover:bg-destructive/10 hover:text-destructive transition-all duration-150 active:scale-95"
                title="Delete"
              >
                <Trash2 size={11} />
              </button>
            </ConfirmPopover>
          )}
        </div>
      )}
    </div>
  );
}
