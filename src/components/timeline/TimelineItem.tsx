'use client';

import { Phone, Users, MapPin, FileText, GraduationCap, CheckSquare, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils/dateUtils';
import type { TimelineEvent } from '@/types/entities';

const ACTIVITY_CONFIG = {
  meeting: { icon: Users, color: '#8b5cf6', bg: '#f5f3ff', label: 'Meeting' },
  visit: { icon: MapPin, color: '#06b6d4', bg: '#ecfeff', label: 'Visit' },
  call: { icon: Phone, color: '#22c55e', bg: '#f0fdf4', label: 'Call' },
  note: { icon: FileText, color: '#f59e0b', bg: '#fffbeb', label: 'Note' },
};

interface TimelineItemProps {
  event: TimelineEvent;
  isLast: boolean;
}

export function TimelineItem({ event, isLast }: TimelineItemProps) {
  if (event.kind === 'activity') {
    const config = ACTIVITY_CONFIG[event.type];
    const Icon = config.icon;
    return (
      <div className="flex gap-4 pb-4 ml-0">
        <div className="relative z-10 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-white"
            style={{ backgroundColor: config.bg }}
          >
            <Icon size={14} style={{ color: config.color }} />
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900">{event.subject}</span>
            <Badge variant="outline" className="text-xs capitalize">{config.label}</Badge>
          </div>
          {event.description && (
            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{event.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{formatDate(event.occurredAt)} · {event.createdByName}</p>
        </div>
      </div>
    );
  }

  if (event.kind === 'training') {
    const statusLabel = event.status === 'completed' ? 'Completed' : event.status === 'registered' ? 'Upcoming' : 'Cancelled';
    const statusVariant = event.status === 'completed' ? 'success' : event.status === 'registered' ? 'info' : 'secondary';
    return (
      <div className="flex gap-4 pb-4">
        <div className="relative z-10 flex-shrink-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-white bg-indigo-50">
            <GraduationCap size={14} className="text-indigo-500" />
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-900">{event.title}</span>
            <Badge variant={statusVariant} className="text-xs">{statusLabel}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(event.trainingDate)}
            {event.provider && ` · ${event.provider}`}
            {event.participant && ` · ${event.participant}`}
          </p>
        </div>
      </div>
    );
  }

  // followup
  return (
    <div className="flex gap-4 pb-4">
      <div className="relative z-10 flex-shrink-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-white ${event.completed ? 'bg-green-50' : 'bg-amber-50'}`}>
          {event.completed
            ? <CheckSquare size={14} className="text-green-500" />
            : <Calendar size={14} className="text-amber-500" />
          }
        </div>
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-semibold ${event.completed ? 'line-through text-muted-foreground' : 'text-slate-900'}`}>
            {event.title}
          </span>
          <Badge variant={event.completed ? 'success' : 'warning'} className="text-xs">
            {event.completed ? 'Done' : 'Open'}
          </Badge>
        </div>
        {event.description && (
          <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">Due {formatDate(event.dueDate)}</p>
      </div>
    </div>
  );
}
