import { create } from 'zustand';
import type { Opportunity } from '@/types/entities';

interface OpportunityState {
  opportunities: Opportunity[];
  currentCustomerId: string | null;
  isLoading: boolean;

  setOpportunities: (opportunities: Opportunity[], customerId: string | null) => void;
  addOpportunity: (opportunity: Opportunity) => void;
  updateOpportunity: (opportunity: Opportunity) => void;
  removeOpportunity: (id: string) => void;
  setLoading: (loading: boolean) => void;
  clearForCustomer: () => void;
}

export const useOpportunityStore = create<OpportunityState>((set) => ({
  opportunities: [],
  currentCustomerId: null,
  isLoading: false,

  setOpportunities: (opportunities, customerId) =>
    set({ opportunities, currentCustomerId: customerId }),

  addOpportunity: (opportunity) =>
    set((s) => ({
      opportunities: [opportunity, ...s.opportunities],
    })),

  updateOpportunity: (opportunity) =>
    set((s) => ({
      opportunities: s.opportunities.map((o) => (o.id === opportunity.id ? opportunity : o)),
    })),

  removeOpportunity: (id) =>
    set((s) => ({
      opportunities: s.opportunities.filter((o) => o.id !== id),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  clearForCustomer: () => set({ opportunities: [], currentCustomerId: null }),
}));
