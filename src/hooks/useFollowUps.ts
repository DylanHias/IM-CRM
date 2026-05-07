'use client';

import { useEffect, useCallback } from 'react';
import { useFollowUpStore } from '@/store/followUpStore';
import {
  queryFollowUpsByCustomer,
  insertFollowUp,
  completeFollowUp,
  uncompleteFollowUp,
  updateFollowUp as dbUpdateFollowUp,
  deleteFollowUp as dbDeleteFollowUp,
  queryOverdueFollowUpCount,
} from '@/lib/db/queries/followups';
import { insertPendingDelete } from '@/lib/db/queries/pendingDeletes';
import { updateCustomerLastActivity } from '@/lib/db/queries/customers';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { emitDataEvent } from '@/lib/dataEvents';
import { directPushFollowUp, directDeleteFollowUp } from '@/lib/sync/directPushService';
import { notifyPush } from '@/lib/sync/pushToast';
import { toast } from 'sonner';
import type { FollowUp } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '@/store/authStore';
import { useD365UserId } from '@/hooks/useD365UserId';

export function useFollowUps(customerId: string) {
  const { followUps, currentCustomerId, isLoading, setFollowUps, addFollowUp, updateFollowUp, removeFollowUp, markComplete, markUncomplete, setLoading, setOverdueCount } =
    useFollowUpStore();
  const { account } = useAuthStore();
  const d365UserId = useD365UserId();

  useEffect(() => {
    if (currentCustomerId === customerId) return;

    setLoading(true);
    const load = async () => {
      try {
        if (isTauriApp()) {
          const data = await queryFollowUpsByCustomer(customerId);
          console.log(`[followup] Loaded ${data.length} follow-ups for customer ${customerId}`);
          setFollowUps(data, customerId);
          const overdue = await queryOverdueFollowUpCount(d365UserId ?? account?.localAccountId ?? undefined, account?.localAccountId ?? undefined);
          setOverdueCount(overdue);
        } else {
          setFollowUps([], customerId);
        }
      } catch (err) {
        console.error('[followup] Failed to load:', err);
        setFollowUps([], customerId);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customerId, currentCustomerId, setFollowUps, setLoading, setOverdueCount, d365UserId, account?.localAccountId]);

  const createFollowUp = useCallback(
    async (input: Omit<FollowUp, 'id' | 'createdById' | 'createdByName' | 'syncStatus' | 'remoteId' | 'source' | 'createdAt' | 'updatedAt' | 'completed' | 'completedAt'>) => {
      const now = new Date().toISOString();
      const followUp: FollowUp = {
        ...input,
        id: uuidv4(),
        createdById: d365UserId ?? account?.localAccountId ?? 'unknown',
        createdByName: account?.name ?? 'Unknown User',
        syncStatus: 'pending',
        remoteId: null,
        source: 'local',
        completed: false,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      if (isTauriApp()) {
        await insertFollowUp(followUp);
        await updateCustomerLastActivity(customerId, now);
        notifyPush(() => directPushFollowUp(followUp), {
          entity: 'follow-up',
          action: 'created',
          label: followUp.title,
          onSuccess: (remoteId) => {
            updateFollowUp({ ...followUp, syncStatus: 'synced', remoteId });
            emitDataEvent('followup', 'updated', customerId);
          },
        });
      }
      addFollowUp(followUp);
      emitDataEvent('followup', 'created', customerId);
      return followUp;
    },
    [account, d365UserId, customerId, addFollowUp, updateFollowUp]
  );

  const complete = useCallback(
    async (id: string) => {
      if (isTauriApp()) {
        await completeFollowUp(id);
        const target = followUps.find((f) => f.id === id);
        if (target) {
          const now = new Date().toISOString();
          const updated = { ...target, completed: true, completedAt: now, syncStatus: 'pending' as const };
          notifyPush(() => directPushFollowUp(updated), {
            entity: 'follow-up',
            action: 'marked complete',
            label: target.title,
            onSuccess: (remoteId) => {
              updateFollowUp({ ...updated, syncStatus: 'synced', remoteId });
              emitDataEvent('followup', 'updated', customerId);
            },
          });
        }
      }
      markComplete(id);
      emitDataEvent('followup', 'completed', customerId);
    },
    [customerId, followUps, markComplete, updateFollowUp]
  );

  const uncomplete = useCallback(
    async (id: string) => {
      if (isTauriApp()) {
        await uncompleteFollowUp(id);
        const target = followUps.find((f) => f.id === id);
        if (target) {
          const updated = { ...target, completed: false, completedAt: null, syncStatus: 'pending' as const };
          notifyPush(() => directPushFollowUp(updated), {
            entity: 'follow-up',
            action: 'reopened',
            label: target.title,
            onSuccess: (remoteId) => {
              updateFollowUp({ ...updated, syncStatus: 'synced', remoteId });
              emitDataEvent('followup', 'updated', customerId);
            },
          });
        }
      }
      markUncomplete(id);
      emitDataEvent('followup', 'updated', customerId);
    },
    [customerId, followUps, markUncomplete, updateFollowUp]
  );

  const editFollowUp = useCallback(
    async (followUp: FollowUp) => {
      if (isTauriApp()) {
        await dbUpdateFollowUp(followUp);
        notifyPush(() => directPushFollowUp(followUp), {
          entity: 'follow-up',
          action: 'updated',
          label: followUp.title,
          onSuccess: (remoteId) => {
            updateFollowUp({ ...followUp, syncStatus: 'synced', remoteId });
            emitDataEvent('followup', 'updated', customerId);
          },
        });
      }
      updateFollowUp(followUp);
      emitDataEvent('followup', 'updated', customerId);
    },
    [customerId, updateFollowUp]
  );

  const removeFU = useCallback(
    async (id: string) => {
      if (isTauriApp()) {
        const deleted = await dbDeleteFollowUp(id);
        if (deleted?.remoteId) {
          const toastId = toast.loading('Removing follow-up from Dynamics 365…');
          const directDeleted = await directDeleteFollowUp(deleted.remoteId);
          if (!directDeleted) {
            await insertPendingDelete('task', deleted.remoteId);
            toast.error('Could not remove follow-up from Dynamics 365', {
              id: toastId,
              description: 'Queued for retry on next sync',
            });
          } else {
            toast.success('Follow-up removed from Dynamics 365', { id: toastId });
          }
        }
      }
      removeFollowUp(id);
      emitDataEvent('followup', 'deleted', customerId);
    },
    [customerId, removeFollowUp]
  );

  return {
    followUps: followUps.filter((f) => f.customerId === customerId),
    isLoading,
    createFollowUp,
    completeFollowUp: complete,
    uncompleteFollowUp: uncomplete,
    editFollowUp,
    deleteFollowUp: removeFU,
  };
}
