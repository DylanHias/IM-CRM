'use client';

import { useEffect, useCallback } from 'react';
import { useOpportunityStore } from '@/store/opportunityStore';
import { queryOpportunitiesByCustomer, insertOpportunity, updateOpportunity as dbUpdateOpportunity, deleteOpportunity as dbDeleteOpportunity } from '@/lib/db/queries/opportunities';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { useSettingsStore } from '@/store/settingsStore';
import { mockOpportunities } from '@/lib/mock/opportunities';
import { emitDataEvent } from '@/lib/dataEvents';
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
        const useMock = useSettingsStore.getState().mockDataEnabled;
        if (!useMock && isTauriApp()) {
          const data = await queryOpportunitiesByCustomer(customerId);
          setOpportunities(data, customerId);
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
        try {
          await insertOpportunity(opportunity);
        } catch (err) {
          console.error('[opportunity] DB insert failed, adding to store only:', err);
        }
      }
      addOpportunity(opportunity);
      emitDataEvent('opportunity', 'created', customerId);
      return opportunity;
    },
    [account, customerId, addOpportunity]
  );

  const editOpportunity = useCallback(
    async (opportunity: Opportunity) => {
      if (isTauriApp()) {
        try {
          await dbUpdateOpportunity(opportunity);
        } catch (err) {
          console.error('[opportunity] DB update failed:', err);
        }
      }
      updateOpportunity(opportunity);
      emitDataEvent('opportunity', 'updated', customerId);
    },
    [customerId, updateOpportunity]
  );

  const removeOpp = useCallback(
    async (id: string) => {
      if (isTauriApp()) {
        try {
          await dbDeleteOpportunity(id);
        } catch (err) {
          console.error('[opportunity] DB delete failed:', err);
        }
      }
      removeOpportunity(id);
      emitDataEvent('opportunity', 'deleted', customerId);
    },
    [customerId, removeOpportunity]
  );

  return {
    opportunities: opportunities.filter((o) => o.customerId === customerId),
    isLoading,
    createOpportunity,
    editOpportunity,
    deleteOpportunity: removeOpp,
  };
}
