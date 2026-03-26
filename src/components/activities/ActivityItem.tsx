'use client';

import { Phone, Users, MapPin, FileText, Clock, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { formatDate } from '@/lib/utils/dateUtils';
import type { Activity } from '@/types/entities';

const ACTIVITY_ICONS = {
  meeting: { icon: Users, colorClass: 'text-activity-meeting', bgClass: 'bg-activity-meeting-bg', label: 'Meeting' },
  visit: { icon: MapPin, colorClass: 'text-activity-visit', bgClass: 'bg-activity-visit-bg', label: 'Visit' },
  call: { icon: Phone, colorClass: 'text-activity-call', bgClass: 'bg-activity-call-bg', label: 'Call' },
  note: { icon: FileText, colorClass: 'text-activity-note', bgClass: 'bg-activity-note-bg', label: 'Note' },
};

interface ActivityItemProps {
  activity: Activity;
  contactName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ActivityItem({ activity, contactName, onEdit, onDelete }: ActivityItemProps) {
  const config = ACTIVITY_ICONS[activity.type];
  const Icon = config.icon;

  return (
    <div className="flex gap-3 py-3 border-b last:border-b-0 group">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${config.bgClass}`}
      >
        <Icon size={15} className={config.colorClass} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{activity.subject}</span>
              <Badge variant="outline" className="text-xs capitalize">{config.label}</Badge>
              {activity.syncStatus === 'pending' && (
                <Badge variant="warning" className="text-xs gap-1">
                  <Clock size={10} />
                  Pending sync
                </Badge>
              )}
              {activity.syncStatus === 'error' && (
                <Badge variant="destructive" className="text-xs gap-1">
                  <AlertCircle size={10} />
                  Sync error
                </Badge>
              )}
            </div>

            {activity.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{activity.description}</p>
            )}

            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span>{formatDate(activity.occurredAt)}</span>
              {contactName && <span>· {contactName}</span>}
              <span>· {activity.createdByName}</span>
            </div>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {onEdit && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Edit">
                <Pencil size={13} />
              </Button>
            )}
            {onDelete && (
              <ConfirmPopover message={`Delete "${activity.subject}"?`} confirmLabel="Delete" onConfirm={onDelete}>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete">
                  <Trash2 size={13} />
                </Button>
              </ConfirmPopover>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
