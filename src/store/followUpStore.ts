import { create } from 'zustand';
import type { FollowUp } from '@/types/entities';

interface FollowUpState {
  followUps: FollowUp[];
  currentCustomerId: string | null;
  overdueCount: number;
  isLoading: boolean;

  setFollowUps: (followUps: FollowUp[], customerId: string) => void;
  addFollowUp: (followUp: FollowUp) => void;
  markComplete: (id: string) => void;
  setOverdueCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useFollowUpStore = create<FollowUpState>((set) => ({
  followUps: [],
  currentCustomerId: null,
  overdueCount: 0,
  isLoading: false,

  setFollowUps: (followUps, customerId) =>
    set({ followUps, currentCustomerId: customerId }),

  addFollowUp: (followUp) =>
    set((s) => ({ followUps: [...s.followUps, followUp] })),

  markComplete: (id) =>
    set((s) => ({
      followUps: s.followUps.map((f) =>
        f.id === id
          ? { ...f, completed: true, completedAt: new Date().toISOString(), syncStatus: 'pending' as const }
          : f
      ),
    })),

  setOverdueCount: (overdueCount) => set({ overdueCount }),
  setLoading: (isLoading) => set({ isLoading }),
}));
