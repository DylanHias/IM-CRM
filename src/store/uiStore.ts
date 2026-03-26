import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSettingsStore } from '@/store/settingsStore';

interface UIState {
  sidebarOpen: boolean;
  activeCustomerTab: string;
  commandPaletteOpen: boolean;
  shortcutsGuideOpen: boolean;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveCustomerTab: (tab: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setShortcutsGuideOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: useSettingsStore.getState().sidebarDefaultExpanded,
      activeCustomerTab: 'timeline',
      commandPaletteOpen: false,
      shortcutsGuideOpen: false,

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setActiveCustomerTab: (activeCustomerTab) => set({ activeCustomerTab }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setShortcutsGuideOpen: (shortcutsGuideOpen) => set({ shortcutsGuideOpen }),
    }),
    {
      name: 'crm-ui-store',
      partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
    }
  )
);
