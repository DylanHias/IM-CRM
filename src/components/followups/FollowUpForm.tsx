'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/DatePicker';
import { useFollowUps } from '@/hooks/useFollowUps';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface FollowUpFormProps {
  customerId: string;
  customerName: string;
  activityId?: string;
}

export function FollowUpForm({ customerId, customerName, activityId }: FollowUpFormProps) {
  const router = useRouter();
  const { createFollowUp } = useFollowUps(customerId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

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
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="What needs to be done?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Additional context or details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="dueDate">Due Date *</Label>
        <DatePicker
          value={dueDate}
          onChange={setDueDate}
          minDate={new Date()}
          placeholder="Select due date"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !title.trim() || !dueDate} className="flex-1">
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
