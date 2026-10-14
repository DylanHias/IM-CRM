'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotesTable } from './NotesTable';
import { ActivityKanbanBoard } from './ActivityKanbanBoard';
import { ActivityDateFilter } from './ActivityDateFilter';
import { ActivityPreviewDialog } from './ActivityPreviewDialog';
import type { Activity, ActivityStatus, Contact } from '@/types/entities';
import type { ActivityDateRange } from './ActivityDateFilter';

interface ActivitiesTabContentProps {
  activities: Activity[];
  contacts: Contact[];
  onAddActivity: () => void;
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activity: Activity) => void;
  onStatusChange: (activity: Activity, newStatus: ActivityStatus) => void;
  onFilteredCountChange?: (count: number) => void;
}

export function ActivitiesTabContent({
  activities,
  contacts,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onStatusChange,
  onFilteredCountChange,
}: ActivitiesTabContentProps) {
  const [dateRange, setDateRange] = useState<ActivityDateRange | null>(null);
  const [rangeLabel, setRangeLabel] = useState<string | null>(null);
  const [previewActivity, setPreviewActivity] = useState<Activity | null>(null);

  const getContactName = (contactId: string | null) => {
    if (!contactId) return undefined;
    const c = contacts.find((ct) => ct.id === contactId);
    return c ? `${c.firstName} ${c.lastName}` : undefined;
  };

  const handleDateChange = useCallback((range: ActivityDateRange | null, label: string | null) => {
    setDateRange(range);
    setRangeLabel(label);
  }, []);

  const notes = useMemo(() => activities.filter((a) => a.type === 'note'), [activities]);

  const kanbanActivities = useMemo(() => {
    const nonNotes = activities.filter((a) => a.type !== 'note');
    if (!dateRange) return nonNotes;
    return nonNotes.filter((a) => a.occurredAt >= dateRange.from && a.occurredAt <= dateRange.to);
  }, [activities, dateRange]);

  useEffect(() => {
    onFilteredCountChange?.(kanbanActivities.length + notes.length);
  }, [kanbanActivities.length, notes.length, onFilteredCountChange]);

  return (
    <div className="grid content-start gap-3">
      {notes.length > 0 && (
        <NotesTable
          notes={notes}
          contacts={contacts}
          onEdit={onEditActivity}
          onDelete={onDeleteActivity}
          onPreview={setPreviewActivity}
        />
      )}

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[13px] font-semibold text-foreground">Activities</h3>
          {rangeLabel && <span className="text-xs tabular-nums text-muted-foreground">{rangeLabel}</span>}
          <span className="flex-1" />
          <ActivityDateFilter onChange={handleDateChange} />
          <Button size="sm" className="gap-1.5" onClick={onAddActivity}>
            <Plus size={13} />
            Add Activity
          </Button>
        </div>
        <ActivityKanbanBoard
          activities={kanbanActivities}
          contacts={contacts}
          onEdit={onEditActivity}
          onDelete={onDeleteActivity}
          onStatusChange={onStatusChange}
          onPreview={setPreviewActivity}
        />
      </div>

      <ActivityPreviewDialog
        activity={previewActivity}
        contactName={previewActivity ? getContactName(previewActivity.contactId) : undefined}
        onClose={() => setPreviewActivity(null)}
        onEdit={(activity) => {
          setPreviewActivity(null);
          onEditActivity(activity);
        }}
        onDelete={(activity) => {
          onDeleteActivity(activity);
        }}
      />
    </div>
  );
}
