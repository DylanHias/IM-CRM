import { create } from 'zustand';
import type { Activity } from '@/types/entities';

interface ActivityState {
  activities: Activity[];
  currentCustomerId: string | null;
  pendingCount: number;
  isLoading: boolean;

  setActivities: (activities: Activity[], customerId: string) => void;
  addActivity: (activity: Activity) => void;
  setPendingCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  clearForCustomer: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  currentCustomerId: null,
  pendingCount: 0,
  isLoading: false,

  setActivities: (activities, customerId) =>
    set({ activities, currentCustomerId: customerId }),

  addActivity: (activity) =>
    set((s) => ({
      activities: [activity, ...s.activities],
      pendingCount: s.pendingCount + (activity.syncStatus === 'pending' ? 1 : 0),
    })),

  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLoading: (isLoading) => set({ isLoading }),
  clearForCustomer: () => set({ activities: [], currentCustomerId: null }),
}));
