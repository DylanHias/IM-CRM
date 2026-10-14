'use client';

import { useState } from 'react';
import { Plus, CheckSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FollowUpItem } from './FollowUpItem';
import { FollowUpPreviewDialog } from './FollowUpPreviewDialog';
import { DatePicker } from '@/components/ui/DatePicker';
import { useFollowUps } from '@/hooks/useFollowUps';
import type { FollowUp } from '@/types/entities';

interface FollowUpListProps {
  followUps: FollowUp[];
  customerId: string;
  onComplete: (id: string) => void;
  onAdd?: () => void;
}

export function FollowUpList({ followUps, customerId, onComplete, onAdd }: FollowUpListProps) {
  const { editFollowUp, deleteFollowUp } = useFollowUps(customerId);

  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [previewFollowUp, setPreviewFollowUp] = useState<FollowUp | null>(null);

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
    } catch (err) {
      console.error('[followup] Failed to edit:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (followUp: FollowUp) => {
    try {
      await deleteFollowUp(followUp.id);
    } catch (err) {
      console.error('[followup] Failed to delete:', err);
    }
  };

  const section = (label: string, items: FollowUp[], renderItem: (f: FollowUp) => React.ReactNode, empty?: string) => {
    const headingId = `followups-${label.toLowerCase()}-heading`;
    return (
      <div role="region" aria-labelledby={headingId} className="space-y-2">
        <h3 id={headingId} className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {label} ({items.length})
        </h3>
        <Panel>
          {items.length > 0 ? (
            <div className="stagger-in">{items.map(renderItem)}</div>
          ) : (
            empty && <div className="px-4 py-6 text-center text-[12.5px] text-muted-foreground">{empty}</div>
          )}
        </Panel>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <span className="flex-1" />
        <Button size="sm" onClick={onAdd}>
          <Plus size={13} />
          Add Follow-Up
        </Button>
      </div>

      {followUps.length === 0 ? (
        <Panel>
          <EmptyState icon={CheckSquare} title="No follow-ups yet" />
        </Panel>
      ) : (
        <>
          {section('Scheduled', open, (f) => (
            <FollowUpItem
              key={f.id}
              followUp={f}
              onComplete={onComplete}
              onEdit={() => openEdit(f)}
              onDelete={() => handleDelete(f)}
              onPreview={() => setPreviewFollowUp(f)}
            />
          ))}
          {section(
            'Completed',
            done,
            (f) => <FollowUpItem key={f.id} followUp={f} onPreview={() => setPreviewFollowUp(f)} />,
            'No completed follow-ups yet.',
          )}
        </>
      )}

      <FollowUpPreviewDialog
        followUp={previewFollowUp}
        onClose={() => setPreviewFollowUp(null)}
        onEdit={(f) => {
          setPreviewFollowUp(null);
          openEdit(f);
        }}
        onDelete={(f) => handleDelete(f)}
      />

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-2xl">
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
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={7}
                className="min-h-[180px] resize-y"
              />
            </div>
            <div className="space-y-1">
              <Label>Due Date *</Label>
              <DatePicker value={editDueDate} onChange={setEditDueDate} placeholder="Select due date" />
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
