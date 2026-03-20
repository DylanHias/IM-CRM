import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface UIState {
  sidebarOpen: boolean;
  activeCustomerTab: string;
  theme: Theme;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveCustomerTab: (tab: string) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      activeCustomerTab: 'timeline',
      theme: 'light',

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setActiveCustomerTab: (activeCustomerTab) => set({ activeCustomerTab }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'crm-ui-store',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
