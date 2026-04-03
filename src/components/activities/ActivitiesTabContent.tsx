'use client';

import { useMemo, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotesTable } from './NotesTable';
import { ActivityKanbanBoard } from './ActivityKanbanBoard';
import { ActivityDateFilter } from './ActivityDateFilter';
import type { Activity, ActivityStatus, Contact } from '@/types/entities';

interface DateRange {
  from: string;
  to: string;
}

interface ActivitiesTabContentProps {
  activities: Activity[];
  contacts: Contact[];
  onAddActivity: () => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activity: Activity) => void;
  onStatusChange: (activity: Activity, newStatus: ActivityStatus) => void;
}

export function ActivitiesTabContent({
  activities,
  contacts,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onStatusChange,
}: ActivitiesTabContentProps) {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const handleDateChange = useCallback((range: DateRange | null) => {
    setDateRange(range);
  }, []);

  const notes = useMemo(() => activities.filter((a) => a.type === 'note'), [activities]);

  const kanbanActivities = useMemo(() => {
    const nonNotes = activities.filter((a) => a.type !== 'note');
    if (!dateRange) return nonNotes;
    return nonNotes.filter((a) => a.occurredAt >= dateRange.from && a.occurredAt <= dateRange.to);
  }, [activities, dateRange]);

  return (
    <div className="space-y-6">
      {notes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Notes</h3>
          <NotesTable
            notes={notes}
            contacts={contacts}
            onEdit={onEditActivity}
            onDelete={onDeleteActivity}
          />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Activities</h3>
          <div className="flex items-center gap-3">
            <ActivityDateFilter onChange={handleDateChange} />
            <Button size="sm" className="gap-1.5" onClick={onAddActivity}>
              <Plus size={13} />
              Add Activity
            </Button>
          </div>
        </div>
        <ActivityKanbanBoard
          activities={kanbanActivities}
          contacts={contacts}
          onEdit={onEditActivity}
          onDelete={onDeleteActivity}
          onStatusChange={onStatusChange}
        />
      </div>
    </div>
  );
}
