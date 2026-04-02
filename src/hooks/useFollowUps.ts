'use client';

import { useEffect, useCallback } from 'react';
import { useFollowUpStore } from '@/store/followUpStore';
import {
  queryFollowUpsByCustomer,
  insertFollowUp,
  completeFollowUp,
  updateFollowUp as dbUpdateFollowUp,
  deleteFollowUp as dbDeleteFollowUp,
  queryOverdueFollowUpCount,
} from '@/lib/db/queries/followups';
import { insertPendingDelete } from '@/lib/db/queries/pendingDeletes';
import { updateCustomerLastActivity } from '@/lib/db/queries/customers';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { emitDataEvent } from '@/lib/dataEvents';
import type { FollowUp } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '@/store/authStore';
import { useD365UserId } from '@/hooks/useD365UserId';

export function useFollowUps(customerId: string) {
  const { followUps, currentCustomerId, isLoading, setFollowUps, addFollowUp, updateFollowUp, removeFollowUp, markComplete, setLoading, setOverdueCount } =
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
          const overdue = await queryOverdueFollowUpCount();
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
  }, [customerId, currentCustomerId, setFollowUps, setLoading, setOverdueCount]);

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
      }
      addFollowUp(followUp);
      emitDataEvent('followup', 'created', customerId);
      return followUp;
    },
    [account, d365UserId, customerId, addFollowUp]
  );

  const complete = useCallback(
    async (id: string) => {
      if (isTauriApp()) {
        await completeFollowUp(id);
      }
      markComplete(id);
      emitDataEvent('followup', 'completed', customerId);
    },
    [customerId, markComplete]
  );

  const editFollowUp = useCallback(
    async (followUp: FollowUp) => {
      if (isTauriApp()) {
        await dbUpdateFollowUp(followUp);
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
          await insertPendingDelete('task', deleted.remoteId);
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
    editFollowUp,
    deleteFollowUp: removeFU,
  };
}
