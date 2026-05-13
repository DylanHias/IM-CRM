'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/DatePicker';
import { useFollowUps } from '@/hooks/useFollowUps';
import { useSettingsStore } from '@/store/settingsStore';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

function offsetDateISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

interface FollowUpFormProps {
  customerId: string;
  customerName: string;
  activityId?: string;
}

export function FollowUpForm({ customerId, customerName, activityId }: FollowUpFormProps) {
  const router = useRouter();
  const { createFollowUp } = useFollowUps(customerId);
  const defaultDueDays = useSettingsStore((s) => s.defaultFollowUpDueDays);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => offsetDateISO(defaultDueDays));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      setShowErrors(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createFollowUp({
        customerId,
        activityId: activityId ?? null,
        title: title.trim(),
        description: description.trim() || null,
        dueDate,
      });
      setSuccess(true);
      setTimeout(() => router.back(), 1200);
    } catch (err) {
      console.error('[followup] Failed:', err);
      setError(err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <CheckCircle2 size={40} className="text-success" />
        <p className="text-foreground font-medium">Follow-up created!</p>
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
        <Label htmlFor="title" className={showErrors && !title.trim() ? 'text-rose-600' : ''}>Title *</Label>
        <Input
          id="title"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={showErrors && !title.trim() ? '!border-rose-500 focus-visible:!ring-rose-500' : ''}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className="h-[160px] resize-none overflow-y-auto"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="dueDate" className={showErrors && !dueDate ? 'text-rose-600' : ''}>Due Date *</Label>
        <DatePicker
          id="dueDate"
          value={dueDate}
          onChange={setDueDate}
          minDate={new Date()}
          placeholder="Select due date"
          className={showErrors && !dueDate ? '!border-rose-500' : ''}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 size={15} className="animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Create Follow-Up'
          )}
        </Button>
      </div>
    </form>
  );
}
