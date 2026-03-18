'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Loader2, CheckCircle2, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { upsertTraining } from '@/lib/db/queries/trainings';
import type { Training } from '@/types/entities';

interface TrainingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  onTrainingSaved: (training: Training) => void;
  initialData?: Training;
}

export function TrainingForm({ open, onOpenChange, customerId, onTrainingSaved, initialData }: TrainingFormProps) {
  const isEdit = !!initialData;
  const [title, setTitle] = useState('');
  const [trainingDate, setTrainingDate] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState('');
  const [instructor, setInstructor] = useState('');
  const [status, setStatus] = useState<Training['status']>('registered');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const participantInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title ?? '');
      setTrainingDate(initialData?.trainingDate ?? '');
      setParticipants(initialData?.participant ? initialData.participant.split(', ').filter(Boolean) : []);
      setParticipantInput('');
      setInstructor(initialData?.provider ?? '');
      setStatus(initialData?.status ?? 'registered');
      setSuccess(false);
      setError(null);
    }
  }, [open, initialData]);

  const handleOpenChange = (value: boolean) => {
    if (!value) setSuccess(false);
    onOpenChange(value);
  };

  const addParticipant = () => {
    const name = participantInput.trim();
    if (name && !participants.includes(name)) {
      setParticipants((prev) => [...prev, name]);
    }
    setParticipantInput('');
  };

  const removeParticipant = (name: string) => {
    setParticipants((prev) => prev.filter((p) => p !== name));
  };

  const handleParticipantKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addParticipant();
    } else if (e.key === 'Backspace' && participantInput === '' && participants.length > 0) {
      setParticipants((prev) => prev.slice(0, -1));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !trainingDate) return;

    const finalParticipants = [...participants];
    if (participantInput.trim() && !finalParticipants.includes(participantInput.trim())) {
      finalParticipants.push(participantInput.trim());
    }

    setIsSubmitting(true);
    setError(null);
    const now = new Date().toISOString();

    const training: Training = {
      id: initialData?.id ?? crypto.randomUUID(),
      customerId,
      title: title.trim(),
      trainingDate,
      participant: finalParticipants.length > 0 ? finalParticipants.join(', ') : null,
      provider: instructor.trim() || null,
      status,
      syncedAt: now,
      createdAt: initialData?.createdAt ?? now,
    };

    try {
      if (isTauriApp()) {
        await upsertTraining(training);
      }
      setSuccess(true);
      onTrainingSaved(training);
      setTimeout(() => handleOpenChange(false), 900);
    } catch (err) {
      console.error('[TrainingForm] Failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to save training. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Training' : 'Add Training'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Update training details.' : 'Log a training session for this customer.'}</DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <CheckCircle2 size={40} className="text-green-500" />
            <p className="text-slate-700 font-medium">{isEdit ? 'Training updated!' : 'Training added!'}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="tf-title">Training Title *</Label>
              <Input id="tf-title" placeholder="e.g. Azure Fundamentals" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tf-date">Training Date *</Label>
              <Input id="tf-date" type="date" value={trainingDate} onChange={(e) => setTrainingDate(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label>Participants</Label>
              <div
                className="flex flex-wrap gap-1.5 min-h-[38px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-text"
                onClick={() => participantInputRef.current?.focus()}
              >
                {participants.map((name) => (
                  <span key={name} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 rounded px-2 py-0.5 text-xs font-medium">
                    {name}
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeParticipant(name); }} className="text-slate-400 hover:text-slate-700">
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <input
                  ref={participantInputRef}
                  className="flex-1 min-w-[120px] outline-none bg-transparent placeholder:text-muted-foreground text-sm"
                  placeholder={participants.length === 0 ? 'Type a name, press Enter' : 'Add another...'}
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  onKeyDown={handleParticipantKeyDown}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="tf-instructor">Instructor</Label>
              <Input id="tf-instructor" placeholder="e.g. Jane Doe, Microsoft trainer" value={instructor} onChange={(e) => setInstructor(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="tf-status">Status</Label>
              <select
                id="tf-status"
                value={status ?? 'registered'}
                onChange={(e) => setStatus(e.target.value as Training['status'])}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="registered">Registered</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={isSubmitting || !title.trim() || !trainingDate} className="flex-1">
                {isSubmitting ? <><Loader2 size={15} className="animate-spin mr-2" />Saving...</> : isEdit ? 'Save Changes' : 'Add Training'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
