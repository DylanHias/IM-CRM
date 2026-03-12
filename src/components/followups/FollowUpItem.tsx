'use client';

import { CheckSquare, Square, Calendar, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    <div className={`flex items-start gap-3 py-3 border-b last:border-b-0 group ${followUp.completed ? 'opacity-50' : ''}`}>
      <button
        className="mt-0.5 flex-shrink-0 text-blue-500 hover:text-blue-600 disabled:cursor-not-allowed"
        onClick={() => !followUp.completed && onComplete?.(followUp.id)}
        disabled={followUp.completed}
        title={followUp.completed ? 'Completed' : 'Mark as complete'}
      >
        {followUp.completed ? (
          <CheckSquare size={18} className="text-green-500" />
        ) : (
          <Square size={18} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${followUp.completed ? 'line-through text-muted-foreground' : 'text-slate-900'}`}>
          {followUp.title}
        </p>
        {followUp.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{followUp.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`flex items-center gap-1 text-xs ${isOverdue && !followUp.completed ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
            {isOverdue && !followUp.completed && <AlertCircle size={11} />}
            <Calendar size={10} />
            {dueDateLabel}
          </span>
          {followUp.syncStatus === 'pending' && !followUp.completed && (
            <Badge variant="warning" className="text-xs">Pending sync</Badge>
          )}
        </div>
      </div>

      {!followUp.completed && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Edit">
              <Pencil size={13} />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onDelete} title="Delete">
              <Trash2 size={13} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
