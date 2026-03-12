'use client';

import { useState } from 'react';
import { Plus, CheckSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FollowUpItem } from './FollowUpItem';
import { useFollowUps } from '@/hooks/useFollowUps';
import { todayISO } from '@/lib/utils/dateUtils';
import type { FollowUp } from '@/types/entities';
import { useRouter } from 'next/navigation';

interface FollowUpListProps {
  followUps: FollowUp[];
  customerId: string;
  onComplete: (id: string) => void;
}

export function FollowUpList({ followUps, customerId, onComplete }: FollowUpListProps) {
  const router = useRouter();
  const { editFollowUp, deleteFollowUp } = useFollowUps(customerId);

  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const byDate = (a: FollowUp, b: FollowUp) => b.dueDate.localeCompare(a.dueDate);
  const open = followUps.filter((f) => !f.completed).sort(byDate);
  const done = followUps.filter((f) => f.completed).sort(byDate);

  const openEdit = (followUp: FollowUp) => {
    setEditing(followUp);
    setEditTitle(followUp.title);
    setEditDescription(followUp.description ?? '');
    setEditDueDate(followUp.dueDate);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editTitle.trim() || !editDueDate) return;
    setIsSaving(true);
    try {
      await editFollowUp({
        ...editing,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        dueDate: editDueDate,
        updatedAt: new Date().toISOString(),
      });
      setEditing(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (followUp: FollowUp) => {
    if (!confirm(`Delete "${followUp.title}"?`)) return;
    await deleteFollowUp(followUp.id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Follow-Ups ({open.length} open)
        </h3>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          onClick={() => router.push(`/followups/new?customerId=${customerId}`)}
        >
          <Plus size={13} />
          Add Follow-Up
        </Button>
      </div>

      {followUps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CheckSquare size={28} className="text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No follow-ups yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {open.length > 0 && (
            <div className="bg-white border rounded-lg px-4 divide-y">
              {open.map((f) => (
                <FollowUpItem
                  key={f.id}
                  followUp={f}
                  onComplete={onComplete}
                  onEdit={() => openEdit(f)}
                  onDelete={() => handleDelete(f)}
                />
              ))}
            </div>
          )}
          {done.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Completed ({done.length})</p>
              <div className="bg-white border rounded-lg px-4 divide-y">
                {done.map((f) => (
                  <FollowUpItem key={f.id} followUp={f} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Follow-Up</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1">
              <Label>Due Date *</Label>
              <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} required />
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setEditing(null)} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={isSaving || !editTitle.trim() || !editDueDate} className="flex-1">
                {isSaving ? <><Loader2 size={15} className="animate-spin mr-2" />Saving...</> : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
