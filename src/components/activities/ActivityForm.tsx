'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/DatePicker';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { useActivities } from '@/hooks/useActivities';
import { useSettingsStore } from '@/store/settingsStore';
import { todayISO, nowDatetimeLocal } from '@/lib/utils/dateUtils';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import type { Contact } from '@/types/entities';

interface ActivityFormProps {
  customerId: string;
  customerName: string;
  contacts: Contact[];
}

const ACTIVITY_TYPES = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'visit', label: 'Visit' },
  { value: 'call', label: 'Call' },
  { value: 'note', label: 'Note' },
] as const;

export function ActivityForm({ customerId, customerName, contacts }: ActivityFormProps) {
  const router = useRouter();
  const { createActivity } = useActivities(customerId);
  const defaultActivityType = useSettingsStore((s) => s.defaultActivityType);

  // null = user hasn't touched the type yet, so we derive from settings
  const [typeOverride, setTypeOverride] = useState<'meeting' | 'visit' | 'call' | 'note' | null>(null);
  const type = typeOverride ?? defaultActivityType;

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const isAppointmentType = type === 'meeting' || type === 'visit';
  const [startTime, setStartTime] = useState(nowDatetimeLocal());
  const [occurredAt, setOccurredAt] = useState(isAppointmentType ? nowDatetimeLocal() : todayISO());
  const [contactId, setContactId] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createActivity({
        customerId,
        contactId: contactId === 'none' ? null : contactId,
        type,
        subject: subject.trim(),
        description: description.trim() || null,
        occurredAt: new Date(occurredAt).toISOString(),
        startTime: isAppointmentType ? new Date(startTime).toISOString() : null,
      });
      setSuccess(true);
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      console.error('[activity] Failed to create:', err);
      setError(err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <CheckCircle2 size={40} className="text-success" />
        <p className="text-foreground font-medium">Activity logged successfully!</p>
        <p className="text-sm text-muted-foreground">Redirecting back...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      <div className="space-y-1">
        <Label>Customer</Label>
        <div className="h-10 px-3 flex items-center bg-muted rounded-md text-sm text-muted-foreground">
          {customerName}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="type">Activity Type *</Label>
        <Select value={type} onValueChange={(v) => {
          const newType = v as 'meeting' | 'visit' | 'call' | 'note';
          setTypeOverride(newType);
          const wasAppointment = type === 'meeting' || type === 'visit';
          const isNowAppointment = newType === 'meeting' || newType === 'visit';
          if (wasAppointment !== isNowAppointment) {
            setOccurredAt(isNowAppointment ? nowDatetimeLocal() : todayISO());
            setStartTime(nowDatetimeLocal());
          }
        }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          placeholder={type === 'note' ? 'Note title...' : 'Meeting / call subject...'}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="What was discussed? Key outcomes, next steps..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      {isAppointmentType ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="startTime">Start *</Label>
            <DateTimePicker value={startTime} onChange={setStartTime} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="occurredAt">End *</Label>
            <DateTimePicker value={occurredAt} onChange={setOccurredAt} />
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <Label htmlFor="occurredAt">Date *</Label>
          <DatePicker
            id="occurredAt"
            value={occurredAt}
            onChange={setOccurredAt}
            maxDate={new Date()}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Contact (optional)</Label>
          <Select value={contactId} onValueChange={setContactId}>
            <SelectTrigger>
              <SelectValue placeholder="Select contact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No specific contact</SelectItem>
              {contacts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                  {c.jobTitle ? ` — ${c.jobTitle}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !subject.trim()} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 size={15} className="animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Log Activity'
          )}
        </Button>
      </div>
    </form>
  );
}
