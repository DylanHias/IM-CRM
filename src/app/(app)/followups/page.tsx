'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { listContainerVariants, listItemVariants } from '@/lib/motion';
import { FollowUpItem } from '@/components/followups/FollowUpItem';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/DatePicker';
import { TablePagination } from '@/components/ui/TablePagination';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
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

  const [overduePage, setOverduePage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [donePage, setDonePage] = useState(1);

  const { pageSize: overduePageSize, setPageSize: setOverduePageSize, pageSizeOptions } = usePaginationPreference('followups-overdue');
  const { pageSize: upcomingPageSize, setPageSize: setUpcomingPageSize } = usePaginationPreference('followups-upcoming');
  const { pageSize: donePageSize, setPageSize: setDonePageSize } = usePaginationPreference('followups-done');

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
      const now = new Date().toISOString();
      if (isTauriApp()) {
        await completeFollowUp(id);
        const target = followUps.find((f) => f.id === id);
        if (target) {
          directPushFollowUp({ ...target, completed: true, completedAt: now, syncStatus: 'pending' }).then((result) => {
            if (result) {
              setFollowUps((prev) =>
                prev.map((f) => f.id === id ? { ...f, syncStatus: 'synced', remoteId: result.remoteId } : f)
              );
              emitDataEvent('followup', 'updated', target.customerId);
            }
          });
        }
      }
      markComplete(id);
      setFollowUps((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, completed: true, completedAt: now, syncStatus: 'pending' } : f
        )
      );
      emitDataEvent('followup', 'completed', followUps.find((f) => f.id === id)?.customerId ?? '');
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
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  const overdueSlice = overdue.slice((overduePage - 1) * overduePageSize, overduePage * overduePageSize);
  const upcomingSlice = upcoming.slice((upcomingPage - 1) * upcomingPageSize, upcomingPage * upcomingPageSize);
  const doneSlice = done.slice((donePage - 1) * donePageSize, donePage * donePageSize);

  const getCustomerName = (customerId: string) =>
    customerMap.get(customerId) ?? customerId;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div data-tour="page-followups">
        <h2 className="text-xl font-semibold text-foreground">Your Follow-Ups</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your open tasks and next actions across all customers.
        </p>
      </div>

      {overdue.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-destructive">Overdue</h3>
            <Badge variant="destructive">{overdue.length}</Badge>
          </div>
          <motion.div
            className="bg-card rounded-xl px-4 divide-y divide-border/70 shadow-sm border-l-4 border-l-destructive/60 border border-border/60"
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {overdueSlice.map((f) => (
              <motion.div key={f.id} variants={listItemVariants}>
                <p className="text-xs text-muted-foreground pt-2 cursor-pointer hover:underline" onClick={() => router.push(`/customers?id=${f.customerId}`)}>
                  {getCustomerName(f.customerId)}
                </p>
                <FollowUpItem followUp={f} onComplete={handleComplete} onEdit={() => openEdit(f)} onDelete={() => handleDelete(f)} />
              </motion.div>
            ))}
          </motion.div>
          <TablePagination
            totalItems={overdue.length}
            page={overduePage}
            pageSize={overduePageSize}
            pageSizeOptions={pageSizeOptions}
            onPageChange={setOverduePage}
            onPageSizeChange={(s) => { setOverduePageSize(s); setOverduePage(1); }}
          />
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Upcoming ({upcoming.length})</h3>
          <motion.div
            className="bg-card rounded-xl px-4 divide-y divide-border/70 shadow-sm border border-border/60"
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {upcomingSlice.map((f) => (
              <motion.div key={f.id} variants={listItemVariants}>
                <p className="text-xs text-muted-foreground pt-2 cursor-pointer hover:underline" onClick={() => router.push(`/customers?id=${f.customerId}`)}>
                  {getCustomerName(f.customerId)}
                </p>
                <FollowUpItem followUp={f} onComplete={handleComplete} onEdit={() => openEdit(f)} onDelete={() => handleDelete(f)} />
              </motion.div>
            ))}
          </motion.div>
          <TablePagination
            totalItems={upcoming.length}
            page={upcomingPage}
            pageSize={upcomingPageSize}
            pageSizeOptions={pageSizeOptions}
            onPageChange={setUpcomingPage}
            onPageSizeChange={(s) => { setUpcomingPageSize(s); setUpcomingPage(1); }}
          />
        </section>
      )}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Completed ({done.length})</h3>
        {done.length === 0 ? (
          <div className="bg-card rounded-xl px-4 py-6 text-center text-sm text-muted-foreground border border-border/60 shadow-sm">
            No completed follow-ups yet.
          </div>
        ) : (
          <>
            <motion.div
              className="bg-card rounded-xl px-4 divide-y divide-border/70 shadow-sm border border-border/60"
              variants={listContainerVariants}
              initial="hidden"
              animate="visible"
            >
              {doneSlice.map((f) => (
                <motion.div key={f.id} variants={listItemVariants}>
                  <p className="text-xs text-muted-foreground pt-2 cursor-pointer hover:underline" onClick={() => router.push(`/customers?id=${f.customerId}`)}>
                    {getCustomerName(f.customerId)}
                  </p>
                  <FollowUpItem followUp={f} />
                </motion.div>
              ))}
            </motion.div>
            <TablePagination
              totalItems={done.length}
              page={donePage}
              pageSize={donePageSize}
              pageSizeOptions={pageSizeOptions}
              onPageChange={setDonePage}
              onPageSizeChange={(s) => { setDonePageSize(s); setDonePage(1); }}
            />
          </>
        )}
      </section>

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
