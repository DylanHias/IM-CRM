'use client';

import { useEffect, useCallback } from 'react';
import { useActivityStore } from '@/store/activityStore';
import { queryActivitiesByCustomer, insertActivity, updateActivity as dbUpdateActivity, deleteActivity as dbDeleteActivity, countPendingActivities } from '@/lib/db/queries/activities';
import { insertPendingDelete } from '@/lib/db/queries/pendingDeletes';
import { updateCustomerLastActivity } from '@/lib/db/queries/customers';
import { refreshCustomerHealth } from '@/lib/customers/refreshHealth';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { emitDataEvent } from '@/lib/dataEvents';
import { directPushActivity, directDeleteActivity } from '@/lib/sync/directPushService';
import { notifyPush } from '@/lib/sync/pushToast';
import { toast } from 'sonner';
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
          console.log(`[activity] Loaded ${data.length} activities for customer ${customerId}`);
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
        if (activity.occurredAt <= now) {
          await updateCustomerLastActivity(customerId, activity.occurredAt);
        }
        refreshCustomerHealth(customerId);
        notifyPush(() => directPushActivity(activity), {
          entity: activity.type === 'note' ? 'note' : activity.type,
          action: 'created',
          label: activity.subject,
          onSuccess: (remoteId) => {
            updateActivity({ ...activity, syncStatus: 'synced', remoteId });
            emitDataEvent('activity', 'updated', customerId);
          },
        });
      }
      addActivity(activity);
      emitDataEvent('activity', 'created', customerId);
      return activity;
    },
    [account, d365UserId, customerId, addActivity, updateActivity]
  );

  const editActivity = useCallback(
    async (activity: Activity) => {
      if (isTauriApp()) {
        await dbUpdateActivity(activity);
        refreshCustomerHealth(customerId);
        notifyPush(() => directPushActivity(activity), {
          entity: activity.type === 'note' ? 'note' : activity.type,
          action: 'updated',
          label: activity.subject,
          onSuccess: (remoteId) => {
            updateActivity({ ...activity, syncStatus: 'synced', remoteId });
            emitDataEvent('activity', 'updated', customerId);
          },
        });
      }
      updateActivity({ ...activity, syncStatus: 'pending' });
      emitDataEvent('activity', 'updated', customerId);
    },
    [customerId, updateActivity]
  );

  const removeAct = useCallback(
    async (id: string) => {
      removeActivity(id);
      emitDataEvent('activity', 'deleted', customerId);
      if (isTauriApp()) {
        const deleted = await dbDeleteActivity(id);
        refreshCustomerHealth(customerId);
        if (deleted?.remoteId) {
          const entityType = deleted.type === 'call' ? 'phonecall' : deleted.type === 'note' ? 'annotation' : 'appointment';
          const d365Type = deleted.type === 'call' ? 'call' : deleted.type === 'note' ? 'note' : 'meeting';
          const noun = deleted.type === 'note' ? 'note' : deleted.type;
          const toastId = toast.loading(`Removing ${noun} from Dynamics 365…`);
          const directDeleted = await directDeleteActivity(deleted.remoteId, d365Type);
          if (!directDeleted) {
            await insertPendingDelete(entityType, deleted.remoteId);
            toast.error(`Could not remove ${noun} from Dynamics 365`, {
              id: toastId,
              description: 'Queued for retry on next sync',
            });
          } else {
            toast.success(`${noun.charAt(0).toUpperCase() + noun.slice(1)} removed from Dynamics 365`, { id: toastId });
          }
        }
      }
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
