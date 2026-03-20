import { create } from 'zustand';
import type { FollowUp } from '@/types/entities';

interface FollowUpState {
  followUps: FollowUp[];
  currentCustomerId: string | null;
  overdueCount: number;
  isLoading: boolean;

  setFollowUps: (followUps: FollowUp[], customerId: string) => void;
  addFollowUp: (followUp: FollowUp) => void;
  updateFollowUp: (followUp: FollowUp) => void;
  removeFollowUp: (id: string) => void;
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

  updateFollowUp: (followUp) =>
    set((s) => ({
      followUps: s.followUps.map((f) => (f.id === followUp.id ? followUp : f)),
    })),

  removeFollowUp: (id) =>
    set((s) => ({
      followUps: s.followUps.filter((f) => f.id !== id),
    })),

  markComplete: (id) =>
    set((s) => {
      const today = new Date().toISOString().split('T')[0];
      const target = s.followUps.find((f) => f.id === id);
      const wasOverdue = target && !target.completed && target.dueDate < today;
      return {
        followUps: s.followUps.map((f) =>
          f.id === id
            ? { ...f, completed: true, completedAt: new Date().toISOString(), syncStatus: 'pending' as const }
            : f
        ),
        overdueCount: wasOverdue ? Math.max(0, s.overdueCount - 1) : s.overdueCount,
      };
    }),

  setOverdueCount: (overdueCount) => set({ overdueCount }),
  setLoading: (isLoading) => set({ isLoading }),
}));
