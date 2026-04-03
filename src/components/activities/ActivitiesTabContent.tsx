'use client';

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotesTable } from './NotesTable';
import { ActivityKanbanBoard } from './ActivityKanbanBoard';
import type { Activity, ActivityStatus, Contact } from '@/types/entities';

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
  const notes = useMemo(() => activities.filter((a) => a.type === 'note'), [activities]);
  const kanbanActivities = useMemo(() => activities.filter((a) => a.type !== 'note'), [activities]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Notes</h3>
        <Button size="sm" className="gap-1.5" onClick={onAddActivity}>
          <Plus size={13} />
          Add Activity
        </Button>
      </div>

      {notes.length > 0 && (
        <div>
          <NotesTable
            notes={notes}
            contacts={contacts}
            onEdit={onEditActivity}
            onDelete={onDeleteActivity}
          />
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Activities</h3>
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
