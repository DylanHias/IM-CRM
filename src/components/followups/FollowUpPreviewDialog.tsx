'use client';

import { Pencil, Trash2, Calendar, AlertCircle, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDueDate } from '@/lib/utils/dateUtils';
import { stripHtml } from '@/lib/utils/htmlUtils';
import type { FollowUp } from '@/types/entities';

interface FollowUpPreviewDialogProps {
  followUp: FollowUp | null;
  onClose: () => void;
  onEdit?: (followUp: FollowUp) => void;
  onDelete?: (followUp: FollowUp) => void;
}

export function FollowUpPreviewDialog({ followUp, onClose, onEdit, onDelete }: FollowUpPreviewDialogProps) {
  if (!followUp) return null;
  const { label: dueDateLabel, isOverdue } = formatDueDate(followUp.dueDate);

  return (
    <Dialog open={!!followUp} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
              <CheckSquare size={13} className="text-primary" />
            </span>
            <span className={`truncate ${followUp.completed ? 'line-through text-muted-foreground' : ''}`}>
              {followUp.title}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-xs gap-1 ${isOverdue && !followUp.completed ? 'text-destructive border-destructive/30 bg-destructive/10' : ''}`}>
              {isOverdue && !followUp.completed && <AlertCircle size={10} />}
              <Calendar size={10} />
              {dueDateLabel}
            </Badge>
            {followUp.completed && (
              <Badge variant="outline" className="text-xs gap-1 bg-success/10 text-success border-success/20">
                <CheckSquare size={10} />
                Completed
              </Badge>
            )}
            {followUp.syncStatus === 'pending' && (
              <Badge variant="warning" className="text-xs">Pending sync</Badge>
            )}
          </div>

          {followUp.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <div className="text-sm text-foreground whitespace-pre-wrap max-h-[320px] overflow-y-auto rounded-md border bg-muted/30 p-3">
                {stripHtml(followUp.description)}
              </div>
            </div>
          )}

          {(onEdit || onDelete) && !followUp.completed && (
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={onClose}>Close</Button>
              {onDelete && (
                <ConfirmPopover
                  message={`Delete "${followUp.title}"?`}
                  confirmLabel="Delete"
                  onConfirm={() => {
                    onDelete(followUp);
                    onClose();
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-9 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                  >
                    <Trash2 size={13} />
                    Delete
                  </Button>
                </ConfirmPopover>
              )}
              {onEdit && (
                <Button size="sm" className="gap-1.5 h-9" onClick={() => onEdit(followUp)}>
                  <Pencil size={13} />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
