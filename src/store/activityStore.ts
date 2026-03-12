import { create } from 'zustand';
import type { Activity } from '@/types/entities';

interface ActivityState {
  activities: Activity[];
  currentCustomerId: string | null;
  pendingCount: number;
  isLoading: boolean;

  setActivities: (activities: Activity[], customerId: string) => void;
  addActivity: (activity: Activity) => void;
  updateActivity: (activity: Activity) => void;
  removeActivity: (id: string) => void;
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

  updateActivity: (activity) =>
    set((s) => ({
      activities: s.activities.map((a) => (a.id === activity.id ? activity : a)),
    })),

  removeActivity: (id) =>
    set((s) => ({
      activities: s.activities.filter((a) => a.id !== id),
    })),

  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLoading: (isLoading) => set({ isLoading }),
  clearForCustomer: () => set({ activities: [], currentCustomerId: null }),
}));
