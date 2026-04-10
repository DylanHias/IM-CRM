'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FollowUpItem } from '@/components/followups/FollowUpItem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/DatePicker';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryFollowUpsByUser, completeFollowUp, updateFollowUp as dbUpdateFollowUp, deleteFollowUp as dbDeleteFollowUp } from '@/lib/db/queries/followups';
import { insertPendingDelete } from '@/lib/db/queries/pendingDeletes';
import { queryAllCustomers } from '@/lib/db/queries/customers';
import { onDataEvent, emitDataEvent } from '@/lib/dataEvents';
import { directPushFollowUp, directDeleteFollowUp } from '@/lib/sync/directPushService';
import type { FollowUp } from '@/types/entities';
import { useFollowUpStore } from '@/store/followUpStore';
import { useAuthStore } from '@/store/authStore';
import { useD365UserId } from '@/hooks/useD365UserId';

export default function FollowUpsPage() {
  const router = useRouter();
  const { markComplete, setOverdueCount } = useFollowUpStore();
  const account = useAuthStore((s) => s.account);
  const d365UserId = useD365UserId();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [customerMap, setCustomerMap] = useState<Map<string, string>>(new Map());

  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const userId = d365UserId ?? account?.localAccountId;

  const loadData = useCallback(async () => {
    try {
      if (isTauriApp() && userId) {
        const [fups, customers] = await Promise.all([
          queryFollowUpsByUser(userId, account?.localAccountId ?? undefined),
          queryAllCustomers(),
        ]);
        setFollowUps(fups);
        setCustomerMap(new Map(customers.map((c) => [c.id, c.name])));
      } else {
        setFollowUps([]);
        setCustomerMap(new Map());
      }
    } catch (err) {
      console.error('[followup] Failed to load follow-ups:', err);
      setFollowUps([]);
      setCustomerMap(new Map());
    }
  }, [userId, account?.localAccountId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return onDataEvent((e) => {
      if (e.entity === 'followup') loadData();
    });
  }, [loadData]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const count = followUps.filter((f) => !f.completed && f.dueDate < today).length;
    setOverdueCount(count);
  }, [followUps, setOverdueCount]);

  const handleComplete = async (id: string) => {
    try {
      if (isTauriApp()) {
        await completeFollowUp(id);
      }
      markComplete(id);
      setFollowUps((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, completed: true, completedAt: new Date().toISOString() } : f
        )
      );
    } catch (err) {
      console.error('[followup] Failed to complete:', err);
    }
  };

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
      const updated: FollowUp = {
        ...editing,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        dueDate: editDueDate,
        updatedAt: new Date().toISOString(),
      };
      if (isTauriApp()) {
        await dbUpdateFollowUp(updated);
        directPushFollowUp(updated).then((result) => {
          if (result) {
            setFollowUps((prev) =>
              prev.map((f) => f.id === updated.id ? { ...updated, syncStatus: 'synced', remoteId: result.remoteId } : f)
            );
          }
        });
      }
      setFollowUps((prev) => prev.map((f) => f.id === updated.id ? updated : f));
      emitDataEvent('followup', 'updated', updated.customerId);
      setEditing(null);
    } catch (err) {
      console.error('[followup] Failed to edit:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (followUp: FollowUp) => {
    try {
      if (isTauriApp()) {
        const deleted = await dbDeleteFollowUp(followUp.id);
        if (deleted?.remoteId) {
          const directDeleted = await directDeleteFollowUp(deleted.remoteId);
          if (!directDeleted) {
            await insertPendingDelete('task', deleted.remoteId);
          }
        }
      }
      setFollowUps((prev) => prev.filter((f) => f.id !== followUp.id));
      emitDataEvent('followup', 'deleted', followUp.customerId);
    } catch (err) {
      console.error('[followup] Failed to delete:', err);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const overdue = followUps.filter((f) => !f.completed && f.dueDate < today);
  const upcoming = followUps.filter((f) => !f.completed && f.dueDate >= today);
  const done = followUps
    .filter((f) => f.completed)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, 10);

  const getCustomerName = (customerId: string) =>
    customerMap.get(customerId) ?? customerId;

  return (
    <div data-tour="page-followups" className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Your Follow-Ups</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track your open tasks and next actions across all customers.
            </p>
          </div>

          {overdue.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-destructive">Overdue</h3>
                <Badge variant="destructive">{overdue.length}</Badge>
              </div>
              <div className="bg-card rounded-xl px-4 divide-y divide-border/70 shadow-sm border-l-4 border-l-destructive/60 border border-border/60">
                {overdue.map((f) => (
                  <div key={f.id}>
                    <p className="text-xs text-muted-foreground pt-2 cursor-pointer hover:underline" onClick={() => router.push(`/customers?id=${f.customerId}`)}>
                      {getCustomerName(f.customerId)}
                    </p>
                    <FollowUpItem followUp={f} onComplete={handleComplete} onEdit={() => openEdit(f)} onDelete={() => handleDelete(f)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">Upcoming ({upcoming.length})</h3>
              <div className="bg-card rounded-xl px-4 divide-y divide-border/70 shadow-sm border border-border/60">
                {upcoming.map((f) => (
                  <div key={f.id}>
                    <p className="text-xs text-muted-foreground pt-2 cursor-pointer hover:underline" onClick={() => router.push(`/customers?id=${f.customerId}`)}>
                      {getCustomerName(f.customerId)}
                    </p>
                    <FollowUpItem followUp={f} onComplete={handleComplete} onEdit={() => openEdit(f)} onDelete={() => handleDelete(f)} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recently Completed</h3>
              <div className="bg-card rounded-xl px-4 divide-y divide-border/70 shadow-sm border border-border/60">
                {done.map((f) => (
                  <FollowUpItem key={f.id} followUp={f} />
                ))}
              </div>
            </section>
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
