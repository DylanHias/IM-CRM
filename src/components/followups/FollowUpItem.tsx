'use client';

import { Check, Calendar, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { formatDueDate } from '@/lib/utils/dateUtils';
import { stripHtml } from '@/lib/utils/htmlUtils';
import { cn } from '@/lib/utils';
import type { FollowUp } from '@/types/entities';

interface FollowUpItemProps {
  followUp: FollowUp;
  onComplete?: (id: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onPreview?: () => void;
}

const CHECK_BASE = 'grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] p-0 transition-colors';

export function FollowUpItem({ followUp, onComplete, onEdit, onDelete, onPreview }: FollowUpItemProps) {
  const { label: dueDateLabel, isOverdue } = formatDueDate(followUp.dueDate);
  const done = followUp.completed;
  const late = isOverdue && !done;
  const description = followUp.description ? stripHtml(followUp.description) : '';

  return (
    <div
      className={cn(
        'group relative flex min-w-0 items-center gap-2.5 border-t border-border px-3 py-2 transition-colors first:border-t-0 hover:bg-surface-2',
        done && 'opacity-60',
        onPreview && 'cursor-pointer',
      )}
      onClick={onPreview}
    >
      {done ? (
        <span
          role="checkbox"
          aria-checked="true"
          aria-label="Completed"
          className={cn(CHECK_BASE, 'border-success bg-success text-success-foreground')}
        >
          <Check size={11} />
        </span>
      ) : (
        // Wrapper stops clicks (including ones inside the portalled confirm popover) from opening the preview
        <span className="contents" onClick={(e) => e.stopPropagation()}>
          <ConfirmPopover
            message={`Mark "${followUp.title}" as complete?`}
            confirmLabel="Complete"
            variant="default"
            onConfirm={() => onComplete?.(followUp.id)}
            side="bottom"
            align="start"
          >
            <button
              type="button"
              role="checkbox"
              aria-checked="false"
              aria-label="Mark as complete"
              title="Mark as complete"
              disabled={!onComplete}
              className={cn(
                CHECK_BASE,
                'group/check border-border-strong bg-card hover:border-success disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              <Check size={11} className="text-transparent group-hover/check:text-success" />
            </button>
          </ConfirmPopover>
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className={cn('truncate text-[13px] font-medium', done ? 'text-muted-foreground line-through' : 'text-foreground')}>
          {followUp.title}
        </div>
        {description && <div className="truncate text-xs text-muted-foreground">{description}</div>}
      </div>

      {followUp.syncStatus === 'pending' && !done && <Badge variant="warning">Pending sync</Badge>}

      <span
        data-testid="followup-due"
        className={cn(
          'inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11.5px] tabular-nums',
          late ? 'font-semibold text-destructive' : 'text-muted-foreground',
        )}
      >
        {late ? <AlertCircle size={11} data-testid="followup-overdue-icon" /> : <Calendar size={11} />}
        {dueDateLabel}
      </span>

      {!done && (onEdit || onDelete) && (
        <span
          className="flex shrink-0 gap-0.5 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <Button type="button" variant="ghost" size="icon" className="size-6 text-muted-foreground" onClick={onEdit} title="Edit" aria-label="Edit">
              <Pencil size={12} />
            </Button>
          )}
          {onDelete && (
            <ConfirmPopover message={`Delete "${followUp.title}"?`} confirmLabel="Delete" onConfirm={onDelete}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-destructive"
                title="Delete"
                aria-label="Delete follow-up"
              >
                <Trash2 size={12} />
              </Button>
            </ConfirmPopover>
          )}
        </span>
      )}
    </div>
  );
}
