import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSettingsStore } from '@/store/settingsStore';

interface UIState {
  sidebarOpen: boolean;
  activeCustomerTab: string;
  commandPaletteOpen: boolean;
  shortcutsGuideOpen: boolean;
  recentCustomerIds: string[];

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveCustomerTab: (tab: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setShortcutsGuideOpen: (open: boolean) => void;
  addRecentCustomer: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: useSettingsStore.getState().sidebarDefaultExpanded,
      activeCustomerTab: 'timeline',
      commandPaletteOpen: false,
      shortcutsGuideOpen: false,
      recentCustomerIds: [],

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setActiveCustomerTab: (activeCustomerTab) => set({ activeCustomerTab }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setShortcutsGuideOpen: (shortcutsGuideOpen) => set({ shortcutsGuideOpen }),
      addRecentCustomer: (id) =>
        set((s) => ({
          recentCustomerIds: [id, ...s.recentCustomerIds.filter((cid) => cid !== id)].slice(0, 5),
        })),
    }),
    {
      name: 'crm-ui-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        recentCustomerIds: state.recentCustomerIds,
      }),
    }
  )
);
