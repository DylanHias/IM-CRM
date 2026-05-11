'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ACTIVITY_ICONS, STATUS_CONFIG } from './ActivityItem';
import { formatDate, formatDateTime } from '@/lib/utils/dateUtils';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import { htmlIsEmpty } from '@/lib/utils/htmlUtils';
import type { Activity } from '@/types/entities';

interface ActivityPreviewDialogProps {
  activity: Activity | null;
  contactName?: string;
  onClose: () => void;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
}

export function ActivityPreviewDialog({ activity, contactName, onClose, onEdit, onDelete }: ActivityPreviewDialogProps) {
  if (!activity) return null;
  const config = ACTIVITY_ICONS[activity.type];
  const Icon = config.icon;
  const statusConfig = STATUS_CONFIG[activity.activityStatus];
  const isAppointment = activity.type === 'meeting' || activity.type === 'visit';
  const dateLabel = isAppointment && activity.startTime
    ? `${formatDateTime(activity.startTime)} – ${formatDateTime(activity.occurredAt)}`
    : formatDate(activity.occurredAt);

  return (
    <Dialog open={!!activity} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgClass}`}>
              <Icon size={13} className={config.colorClass} />
            </span>
            <span className="truncate">{activity.subject}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs capitalize">
              {activity.type === 'call' && activity.direction ? `${activity.direction} ${config.label}` : config.label}
            </Badge>
            {activity.type !== 'note' && (
              <Badge variant="outline" className={`text-xs gap-1 ${statusConfig.className}`}>
                <statusConfig.icon size={10} />
                {statusConfig.label}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Date</p>
              <p className="text-foreground">{dateLabel}</p>
            </div>
            {contactName && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Contact</p>
                <p className="text-foreground">{contactName}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Created by</p>
              <p className="text-foreground">{formatDisplayName(activity.createdByName)}</p>
            </div>
          </div>

          {activity.description && !htmlIsEmpty(activity.description) && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-foreground h-[420px] overflow-y-auto rounded-md border bg-muted/30 p-3 [&_p]:my-1 [&_h1]:my-2 [&_h2]:my-2 [&_h3]:my-2 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0"
                dangerouslySetInnerHTML={{ __html: activity.description }}
              />
            </div>
          )}

          {(onEdit || onDelete) && (
            <div className="flex justify-end gap-2 pt-1">
              {onDelete && (
                <ConfirmPopover
                  message={`Delete "${activity.subject}"?`}
                  confirmLabel="Delete"
                  onConfirm={() => {
                    onDelete(activity);
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
                <Button size="sm" className="gap-1.5 h-9" onClick={() => onEdit(activity)}>
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
