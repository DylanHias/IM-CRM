'use client';

import { useEffect, useCallback } from 'react';
import { useActivityStore } from '@/store/activityStore';
import { queryActivitiesByCustomer, insertActivity, countPendingActivities } from '@/lib/db/queries/activities';
import { updateCustomerLastActivity } from '@/lib/db/queries/customers';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { mockActivities } from '@/lib/mock/activities';
import type { Activity } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '@/store/authStore';

export function useActivities(customerId: string) {
  const { activities, currentCustomerId, isLoading, setActivities, addActivity, setLoading, setPendingCount } =
    useActivityStore();
  const { account } = useAuthStore();

  useEffect(() => {
    if (currentCustomerId === customerId && activities.length > 0) return;

    setLoading(true);
    const load = async () => {
      try {
        if (isTauriApp()) {
          const data = await queryActivitiesByCustomer(customerId);
          setActivities(data, customerId);
          const pending = await countPendingActivities();
          setPendingCount(pending);
        } else {
          const data = mockActivities.filter((a) => a.customerId === customerId);
          setActivities(data, customerId);
        }
      } catch (err) {
        console.error('[useActivities] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customerId, currentCustomerId, activities.length, setActivities, setLoading, setPendingCount]);

  const createActivity = useCallback(
    async (input: Omit<Activity, 'id' | 'createdById' | 'createdByName' | 'syncStatus' | 'remoteId' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const activity: Activity = {
        ...input,
        id: uuidv4(),
        createdById: account?.localAccountId ?? 'unknown',
        createdByName: account?.name ?? 'Unknown User',
        syncStatus: 'pending',
        remoteId: null,
        createdAt: now,
        updatedAt: now,
      };

      if (isTauriApp()) {
        await insertActivity(activity);
        await updateCustomerLastActivity(customerId, activity.occurredAt);
      }
      addActivity(activity);
      return activity;
    },
    [account, customerId, addActivity]
  );

  return {
    activities: activities.filter((a) => a.customerId === customerId),
    isLoading,
    createActivity,
  };
}
