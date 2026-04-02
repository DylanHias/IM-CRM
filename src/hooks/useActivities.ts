'use client';

import { useEffect, useCallback } from 'react';
import { useActivityStore } from '@/store/activityStore';
import { queryActivitiesByCustomer, insertActivity, updateActivity as dbUpdateActivity, deleteActivity as dbDeleteActivity, countPendingActivities } from '@/lib/db/queries/activities';
import { insertPendingDelete } from '@/lib/db/queries/pendingDeletes';
import { updateCustomerLastActivity } from '@/lib/db/queries/customers';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { emitDataEvent } from '@/lib/dataEvents';
import type { Activity } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '@/store/authStore';
import { useD365UserId } from '@/hooks/useD365UserId';

export function useActivities(customerId: string) {
  const { activities, currentCustomerId, isLoading, setActivities, addActivity, updateActivity, removeActivity, setLoading, setPendingCount } =
    useActivityStore();
  const { account } = useAuthStore();
  const d365UserId = useD365UserId();

  useEffect(() => {
    if (currentCustomerId === customerId) return;

    setLoading(true);
    const load = async () => {
      try {
        if (isTauriApp()) {
          const data = await queryActivitiesByCustomer(customerId);
          setActivities(data, customerId);
          const pending = await countPendingActivities();
          setPendingCount(pending);
        } else {
          setActivities([], customerId);
        }
      } catch (err) {
        console.error('[activity] Failed to load:', err);
        setActivities([], customerId);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customerId, currentCustomerId, setActivities, setLoading, setPendingCount]);

  const createActivity = useCallback(
    async (input: Omit<Activity, 'id' | 'createdById' | 'createdByName' | 'syncStatus' | 'remoteId' | 'source' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const activity: Activity = {
        ...input,
        id: uuidv4(),
        createdById: d365UserId ?? account?.localAccountId ?? 'unknown',
        createdByName: account?.name ?? 'Unknown User',
        syncStatus: 'pending',
        remoteId: null,
        source: 'local',
        createdAt: now,
        updatedAt: now,
      };

      if (isTauriApp()) {
        await insertActivity(activity);
        await updateCustomerLastActivity(customerId, activity.occurredAt);
      }
      addActivity(activity);
      emitDataEvent('activity', 'created', customerId);
      return activity;
    },
    [account, d365UserId, customerId, addActivity]
  );

  const editActivity = useCallback(
    async (activity: Activity) => {
      if (isTauriApp()) {
        await dbUpdateActivity(activity);
      }
      updateActivity(activity);
      emitDataEvent('activity', 'updated', customerId);
    },
    [customerId, updateActivity]
  );

  const removeAct = useCallback(
    async (id: string) => {
      if (isTauriApp()) {
        const deleted = await dbDeleteActivity(id);
        if (deleted?.remoteId) {
          const entityType = deleted.type === 'call' ? 'phonecall' : deleted.type === 'note' ? 'annotation' : 'appointment';
          await insertPendingDelete(entityType, deleted.remoteId);
        }
      }
      removeActivity(id);
      emitDataEvent('activity', 'deleted', customerId);
    },
    [customerId, removeActivity]
  );

  return {
    activities: activities.filter((a) => a.customerId === customerId),
    isLoading,
    createActivity,
    editActivity,
    deleteActivity: removeAct,
  };
}
