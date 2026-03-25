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
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { useSettingsStore } from '@/store/settingsStore';
import { mockFollowUps } from '@/lib/mock/followups';
import type { FollowUp } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '@/store/authStore';

export function useFollowUps(customerId: string) {
  const { followUps, currentCustomerId, isLoading, setFollowUps, addFollowUp, updateFollowUp, removeFollowUp, markComplete, setLoading, setOverdueCount } =
    useFollowUpStore();
  const { account } = useAuthStore();

  useEffect(() => {
    if (currentCustomerId === customerId && followUps.length > 0) return;

    setLoading(true);
    const load = async () => {
      try {
        const useMock = useSettingsStore.getState().mockDataEnabled;
        if (!useMock && isTauriApp()) {
          const data = await queryFollowUpsByCustomer(customerId);
          if (data.length > 0) {
            setFollowUps(data, customerId);
            const overdue = await queryOverdueFollowUpCount();
            setOverdueCount(overdue);
          } else {
            setFollowUps(mockFollowUps.filter((f) => f.customerId === customerId), customerId);
          }
        } else {
          setFollowUps(mockFollowUps.filter((f) => f.customerId === customerId), customerId);
        }
      } catch (err) {
        console.error('[useFollowUps] Failed to load:', err);
        setFollowUps(mockFollowUps.filter((f) => f.customerId === customerId), customerId);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customerId, currentCustomerId, followUps.length, setFollowUps, setLoading, setOverdueCount]);

  const createFollowUp = useCallback(
    async (input: Omit<FollowUp, 'id' | 'createdById' | 'createdByName' | 'syncStatus' | 'remoteId' | 'createdAt' | 'updatedAt' | 'completed' | 'completedAt'>) => {
      const now = new Date().toISOString();
      const followUp: FollowUp = {
        ...input,
        id: uuidv4(),
        createdById: account?.localAccountId ?? 'unknown',
        createdByName: account?.name ?? 'Unknown User',
        syncStatus: 'pending',
        remoteId: null,
        completed: false,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      if (isTauriApp()) {
        await insertFollowUp(followUp);
      }
      addFollowUp(followUp);
      return followUp;
    },
    [account, addFollowUp]
  );

  const complete = useCallback(
    async (id: string) => {
      if (isTauriApp()) {
        await completeFollowUp(id);
      }
      markComplete(id);
    },
    [markComplete]
  );

  const editFollowUp = useCallback(
    async (followUp: FollowUp) => {
      if (isTauriApp()) {
        await dbUpdateFollowUp(followUp);
      }
      updateFollowUp(followUp);
    },
    [updateFollowUp]
  );

  const removeFU = useCallback(
    async (id: string) => {
      if (isTauriApp()) {
        await dbDeleteFollowUp(id);
      }
      removeFollowUp(id);
    },
    [removeFollowUp]
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
