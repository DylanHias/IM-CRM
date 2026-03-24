'use client';

import { useEffect, useCallback } from 'react';
import { useOpportunityStore } from '@/store/opportunityStore';
import { queryOpportunitiesByCustomer, insertOpportunity, updateOpportunity as dbUpdateOpportunity, deleteOpportunity as dbDeleteOpportunity } from '@/lib/db/queries/opportunities';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { mockOpportunities } from '@/lib/mock/opportunities';
import type { Opportunity, OpportunityStage } from '@/types/entities';
import { v4 as uuidv4 } from 'uuid';
import { useAuthStore } from '@/store/authStore';

const STAGE_PROBABILITY: Record<OpportunityStage, number> = {
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
  return STAGE_PROBABILITY[stage];
}

export function useOpportunities(customerId: string) {
  const { opportunities, currentCustomerId, isLoading, setOpportunities, addOpportunity, updateOpportunity, removeOpportunity, setLoading } =
    useOpportunityStore();
  const { account } = useAuthStore();

  useEffect(() => {
    if (currentCustomerId === customerId && opportunities.length > 0) return;

    setLoading(true);
    const load = async () => {
      try {
        if (isTauriApp()) {
          const data = await queryOpportunitiesByCustomer(customerId);
          if (data.length > 0) {
            setOpportunities(data, customerId);
          } else {
            setOpportunities(mockOpportunities.filter((o) => o.customerId === customerId), customerId);
          }
        } else {
          setOpportunities(mockOpportunities.filter((o) => o.customerId === customerId), customerId);
        }
      } catch (err) {
        console.error('[useOpportunities] Failed to load:', err);
        setOpportunities(mockOpportunities.filter((o) => o.customerId === customerId), customerId);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customerId, currentCustomerId, opportunities.length, setOpportunities, setLoading]);

  const createOpportunity = useCallback(
    async (input: Omit<Opportunity, 'id' | 'createdById' | 'createdByName' | 'syncStatus' | 'remoteId' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const opportunity: Opportunity = {
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
        await insertOpportunity(opportunity);
      }
      addOpportunity(opportunity);
      return opportunity;
    },
    [account, addOpportunity]
  );

  const editOpportunity = useCallback(
    async (opportunity: Opportunity) => {
      if (isTauriApp()) {
        await dbUpdateOpportunity(opportunity);
      }
      updateOpportunity(opportunity);
    },
    [updateOpportunity]
  );

  const removeOpp = useCallback(
    async (id: string) => {
      if (isTauriApp()) {
        await dbDeleteOpportunity(id);
      }
      removeOpportunity(id);
    },
    [removeOpportunity]
  );

  return {
    opportunities: opportunities.filter((o) => o.customerId === customerId),
    isLoading,
    createOpportunity,
    editOpportunity,
    deleteOpportunity: removeOpp,
  };
}
