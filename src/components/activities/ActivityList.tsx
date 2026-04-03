'use client';

import { useState } from 'react';
import { Plus, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ActivityItem } from './ActivityItem';
import { DatePicker } from '@/components/ui/DatePicker';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { useActivities } from '@/hooks/useActivities';
import { todayISO, nowDatetimeLocal, isoToDatetimeLocal } from '@/lib/utils/dateUtils';
import type { Activity, ActivityStatus, Contact } from '@/types/entities';
import { useRouter } from 'next/navigation';

interface ActivityListProps {
  activities: Activity[];
  contacts: Contact[];
  customerId: string;
}

const ACTIVITY_TYPES = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'visit', label: 'Visit' },
  { value: 'call', label: 'Call' },
  { value: 'note', label: 'Note' },
] as const;

const ACTIVITY_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
] as const;

export function ActivityList({ activities, contacts, customerId }: ActivityListProps) {
  const router = useRouter();
  const { editActivity, deleteActivity } = useActivities(customerId);
  const sorted = [...activities].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  const [editing, setEditing] = useState<Activity | null>(null);
  const [editType, setEditType] = useState<Activity['type']>('meeting');
  const [editSubject, setEditSubject] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editOccurredAt, setEditOccurredAt] = useState('');
  const [editContactId, setEditContactId] = useState('none');
  const [editStatus, setEditStatus] = useState<ActivityStatus>('completed');
  const [isSaving, setIsSaving] = useState(false);

  const openEdit = (activity: Activity) => {
    setEditing(activity);
    setEditType(activity.type);
    setEditSubject(activity.subject);
    setEditDescription(activity.description ?? '');
    const isAppt = activity.type === 'meeting' || activity.type === 'visit';
    setEditStartTime(activity.startTime ? isoToDatetimeLocal(activity.startTime) : nowDatetimeLocal());
    setEditOccurredAt(isAppt ? isoToDatetimeLocal(activity.occurredAt) : activity.occurredAt.split('T')[0]);
    setEditContactId(activity.contactId ?? 'none');
    setEditStatus(activity.activityStatus);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editSubject.trim()) return;
    setIsSaving(true);
    try {
      const isAppt = editType === 'meeting' || editType === 'visit';
      await editActivity({
        ...editing,
        type: editType,
        subject: editSubject.trim(),
        description: editDescription.trim() || null,
        occurredAt: new Date(editOccurredAt).toISOString(),
        startTime: isAppt ? new Date(editStartTime).toISOString() : null,
        contactId: editContactId === 'none' ? null : editContactId,
        activityStatus: editType === 'note' ? 'completed' : editStatus,
        updatedAt: new Date().toISOString(),
      });
      setEditing(null);
    } catch (err) {
      console.error('[activity] Failed to edit:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (activity: Activity) => {
    try {
      await deleteActivity(activity.id);
    } catch (err) {
      console.error('[activity] Failed to delete:', err);
    }
  };

  const getContactName = (contactId: string | null) => {
    if (!contactId) return undefined;
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : undefined;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Activities ({activities.length})</h3>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          onClick={() => router.push(`/activities/new?customerId=${customerId}`)}
        >
          <Plus size={13} />
          Log Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Inbox size={28} className="text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No activities yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">Log the first interaction with this customer</p>
        </div>
      ) : (
        <div className="bg-card border rounded-lg px-4 divide-y">
          {sorted.map((a) => (
            <ActivityItem
              key={a.id}
              activity={a}
              contactName={getContactName(a.contactId)}
              onEdit={() => openEdit(a)}
              onDelete={() => handleDelete(a)}
              onStatusChange={(status) => editActivity({ ...a, activityStatus: status, updatedAt: new Date().toISOString() })}
            />
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={editType} onValueChange={(v) => {
                const newType = v as Activity['type'];
                const wasAppt = editType === 'meeting' || editType === 'visit';
                const isNowAppt = newType === 'meeting' || newType === 'visit';
                setEditType(newType);
                if (wasAppt !== isNowAppt) {
                  setEditOccurredAt(isNowAppt ? nowDatetimeLocal() : todayISO());
                  setEditStartTime(nowDatetimeLocal());
                }
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Subject *</Label>
              <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>
            {(editType === 'meeting' || editType === 'visit') ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Start *</Label>
                  <DateTimePicker value={editStartTime} onChange={setEditStartTime} />
                </div>
                <div className="space-y-1">
                  <Label>End *</Label>
                  <DateTimePicker value={editOccurredAt} onChange={setEditOccurredAt} />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <Label>Date *</Label>
                <DatePicker value={editOccurredAt} onChange={setEditOccurredAt} maxDate={new Date()} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {editType !== 'note' && (
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={(v) => setEditStatus(v as ActivityStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1">
                <Label>Contact</Label>
                <Select value={editContactId} onValueChange={setEditContactId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No contact</SelectItem>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setEditing(null)} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={isSaving || !editSubject.trim()} className="flex-1">
                {isSaving ? <><Loader2 size={15} className="animate-spin mr-2" />Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
