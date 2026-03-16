import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeCustomerTab: string;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveCustomerTab: (tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  activeCustomerTab: 'timeline',

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveCustomerTab: (activeCustomerTab) => set({ activeCustomerTab }),
}));
