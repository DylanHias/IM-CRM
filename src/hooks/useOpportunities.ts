'use client';

import { useEffect, useCallback } from 'react';
import { useOpportunityStore } from '@/store/opportunityStore';
import { queryOpportunitiesByCustomer, insertOpportunity, updateOpportunity as dbUpdateOpportunity } from '@/lib/db/queries/opportunities';
import { updateCustomerLastActivity } from '@/lib/db/queries/customers';
import { refreshCustomerHealth } from '@/lib/customers/refreshHealth';
import { directPushOpportunity } from '@/lib/sync/directPushService';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { emitDataEvent } from '@/lib/dataEvents';
import type { Opportunity, OpportunityStage } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '@/store/authStore';
import { useD365UserId } from '@/hooks/useD365UserId';

const STAGE_PROBABILITY: Record<string, number> = {
  'Prospecting': 5,
  'Validated': 25,
  'Qualified': 50,
  'Verbal Received': 75,
  'Contract Received': 100,
  'Billing Rejection': 100,
  'Pending Vendor Confirmation': 100,
  'Purchased': 100,
};

export function stageToProbability(stage: OpportunityStage): number {
  return STAGE_PROBABILITY[stage] ?? 5;
}

export function useOpportunities(customerId: string) {
  const { opportunities, currentCustomerId, isLoading, setOpportunities, addOpportunity, updateOpportunity, setLoading } =
    useOpportunityStore();
  const { account } = useAuthStore();
  const d365UserId = useD365UserId();

  useEffect(() => {
    if (currentCustomerId === customerId) return;

    setLoading(true);
    const load = async () => {
      try {
        if (isTauriApp()) {
          const data = await queryOpportunitiesByCustomer(customerId);
          setOpportunities(data, customerId);
        } else {
          setOpportunities([], customerId);
        }
      } catch (err) {
        console.error('[opportunity] Failed to load:', err);
        setOpportunities([], customerId);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customerId, currentCustomerId, setOpportunities, setLoading]);

  const createOpportunity = useCallback(
    async (input: Omit<Opportunity, 'id' | 'createdById' | 'createdByName' | 'syncStatus' | 'remoteId' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const opportunity: Opportunity = {
        ...input,
        id: uuidv4(),
        createdById: d365UserId ?? account?.localAccountId ?? 'unknown',
        createdByName: account?.name ?? 'Unknown User',
        syncStatus: 'pending',
        remoteId: null,
        createdAt: now,
        updatedAt: now,
      };

      if (isTauriApp()) {
        await insertOpportunity(opportunity);
        await updateCustomerLastActivity(customerId, now);
        refreshCustomerHealth(customerId);
        directPushOpportunity(opportunity).then((result) => {
          if (result) {
            updateOpportunity({ ...opportunity, syncStatus: 'synced', remoteId: result.remoteId });
            emitDataEvent('opportunity', 'updated', customerId);
          }
        });
      }
      addOpportunity(opportunity);
      emitDataEvent('opportunity', 'created', customerId);
      return opportunity;
    },
    [account, d365UserId, customerId, addOpportunity, updateOpportunity]
  );

  const editOpportunity = useCallback(
    async (opportunity: Opportunity) => {
      if (isTauriApp()) {
        await dbUpdateOpportunity(opportunity);
        refreshCustomerHealth(customerId);
        directPushOpportunity(opportunity).then((result) => {
          if (result) {
            updateOpportunity({ ...opportunity, syncStatus: 'synced', remoteId: result.remoteId });
            emitDataEvent('opportunity', 'updated', customerId);
          }
        });
      }
      updateOpportunity({ ...opportunity, syncStatus: 'pending' });
      emitDataEvent('opportunity', 'updated', customerId);
    },
    [customerId, updateOpportunity]
  );

  return {
    opportunities: opportunities.filter((o) => o.customerId === customerId),
    isLoading,
    createOpportunity,
    editOpportunity,
  };
}
