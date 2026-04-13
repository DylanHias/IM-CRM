'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FollowUpItem } from './FollowUpItem';
import { DatePicker } from '@/components/ui/DatePicker';
import { useFollowUps } from '@/hooks/useFollowUps';
import type { FollowUp } from '@/types/entities';

interface FollowUpListProps {
  followUps: FollowUp[];
  customerId: string;
  onComplete: (id: string) => void;
  onUncomplete?: (id: string) => void;
  onAdd?: () => void;
}

export function FollowUpList({ followUps, customerId, onComplete, onUncomplete, onAdd }: FollowUpListProps) {
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

  return (
    <div>
      {followUps.length === 0 ? (
        <div>
          <div className="flex justify-end mb-3">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={onAdd}
            >
              <Plus size={13} />
              Add Follow-Up
            </Button>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckSquare size={28} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No follow-ups yet</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end mb-2">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={onAdd}
            >
              <Plus size={13} />
              Add Follow-Up
            </Button>
          </div>
          {open.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Scheduled ({open.length})</p>
              <div className="bg-card border border-border/70 rounded-xl overflow-hidden shadow-sm divide-y divide-border/40">
              {open.map((f, i) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4), ease: 'easeOut' }}
                >
                  <FollowUpItem
                    followUp={f}
                    onComplete={onComplete}
                    onEdit={() => openEdit(f)}
                    onDelete={() => handleDelete(f)}
                  />
                </motion.div>
              ))}
              </div>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Completed ({done.length})</p>
              <div className="bg-card border border-border/70 rounded-xl overflow-hidden shadow-sm divide-y divide-border/40">
                {done.map((f, i) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4), ease: 'easeOut' }}
                  >
                    <FollowUpItem followUp={f} onUncomplete={onUncomplete} />
                  </motion.div>
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
