'use client';

import { Phone, Users, MapPin, FileText, CheckSquare, Calendar, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { formatDate } from '@/lib/utils/dateUtils';
import type { TimelineEvent } from '@/types/entities';

const ACTIVITY_CONFIG = {
  meeting: { icon: Users, colorClass: 'text-activity-meeting', bgClass: 'bg-activity-meeting-bg', label: 'Meeting' },
  visit: { icon: MapPin, colorClass: 'text-activity-visit', bgClass: 'bg-activity-visit-bg', label: 'Visit' },
  call: { icon: Phone, colorClass: 'text-activity-call', bgClass: 'bg-activity-call-bg', label: 'Call' },
  note: { icon: FileText, colorClass: 'text-activity-note', bgClass: 'bg-activity-note-bg', label: 'Note' },
};

interface TimelineItemProps {
  event: TimelineEvent;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TimelineItem({ event, onEdit, onDelete }: TimelineItemProps) {
  if (event.kind === 'activity') {
    const config = ACTIVITY_CONFIG[event.type];
    const Icon = config.icon;
    return (
      <div className="flex gap-3.5 px-4 py-3.5 group">
        <div className="relative z-10 flex-shrink-0 mt-0.5">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ring-[3px] ring-card ${config.bgClass}`}
          >
            <Icon size={15} className={config.colorClass} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-foreground">
                <span className="font-medium">{event.subject}</span>
              </p>
              {event.description && (
                <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1">
                  <MessageCircle size={11} />
                  {event.createdByName}
                </span>
              </p>
            </div>
            <div className="flex items-start gap-1.5 flex-shrink-0">
              <span className={`text-xs text-muted-foreground whitespace-nowrap pt-0.5 ${onEdit || onDelete ? 'transition-transform duration-150 translate-x-8 group-hover:translate-x-0' : ''}`}>
                {formatDate(event.occurredAt)}
              </span>
              {(onEdit || onDelete) && (
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
                    <ConfirmPopover message={`Delete "${event.subject}"?`} confirmLabel="Delete" onConfirm={onDelete}>
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
          </div>
        </div>
      </div>
    );
  }

  // followup
  return (
    <div className="flex gap-3.5 px-4 py-3.5 group">
      <div className="relative z-10 flex-shrink-0 mt-0.5">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ring-[3px] ring-card ${event.completed ? 'bg-success/10' : 'bg-warning/10'}`}>
          {event.completed
            ? <CheckSquare size={15} className="text-success" />
            : <Calendar size={15} className="text-warning" />
          }
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-foreground">
              <span className={`font-medium ${event.completed ? 'line-through text-muted-foreground' : ''}`}>
                {event.title}
              </span>
              {' '}
              <Badge variant={event.completed ? 'success' : 'warning'} className="text-[10px] ml-1 align-middle">
                {event.completed ? 'Done' : 'Open'}
              </Badge>
            </p>
            {event.description && (
              <p className="text-[13px] text-muted-foreground mt-0.5">{event.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1.5">
              Due {formatDate(event.dueDate)} {event.createdByName && `\u00b7 ${event.createdByName}`}
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 pt-0.5">
            {formatDate(event.dueDate)}
          </span>
        </div>
      </div>
    </div>
  );
}
