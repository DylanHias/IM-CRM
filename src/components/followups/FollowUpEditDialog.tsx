'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/DatePicker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { FollowUp } from '@/types/entities';

interface Props {
  followUp: FollowUp | null;
  onClose: () => void;
  onSave: (updated: FollowUp) => Promise<void>;
}

/** Edit a follow-up's title, description and due date. */
export function FollowUpEditDialog({ followUp, onClose, onSave }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!followUp) return;
    setTitle(followUp.title);
    setDescription(followUp.description ?? '');
    setDueDate(followUp.dueDate);
  }, [followUp]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUp || !title.trim() || !dueDate) return;
    setSaving(true);
    try {
      await onSave({ ...followUp, title: title.trim(), description: description.trim() || null, dueDate, updatedAt: new Date().toISOString() });
      onClose();
    } catch (err) {
      console.error('[followup] Failed to edit:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!followUp} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Follow-Up</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={7} className="min-h-[180px] resize-y" />
          </div>
          <div className="space-y-1">
            <Label>Due Date *</Label>
            <DatePicker value={dueDate} onChange={setDueDate} placeholder="Select due date" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving || !title.trim() || !dueDate} className="flex-1">
              {saving ? <><Loader2 size={15} className="animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
