import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSettingsStore } from '@/store/settingsStore';

interface UIState {
  sidebarOpen: boolean;
  activeCustomerTab: string;
  commandPaletteOpen: boolean;
  shortcutsGuideOpen: boolean;
  recentCustomerIds: string[];
  newOpportunityRequested: boolean;
  /** Width of the customer list pane in pixels. */
  customerListWidth: number;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveCustomerTab: (tab: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setShortcutsGuideOpen: (open: boolean) => void;
  addRecentCustomer: (id: string) => void;
  clearRecentCustomers: () => void;
  /** Ask the opportunities page to open the New Opportunity wizard when it mounts. */
  setCustomerListWidth: (width: number) => void;
  requestNewOpportunity: () => void;
  /** Returns whether a request was pending and clears it. */
  consumeNewOpportunityRequest: () => boolean;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: useSettingsStore.getState().sidebarDefaultExpanded,
      activeCustomerTab: 'timeline',
      commandPaletteOpen: false,
      shortcutsGuideOpen: false,
      recentCustomerIds: [],
      newOpportunityRequested: false,
      customerListWidth: 300,

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setActiveCustomerTab: (activeCustomerTab) => set({ activeCustomerTab }),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setShortcutsGuideOpen: (shortcutsGuideOpen) => set({ shortcutsGuideOpen }),
      addRecentCustomer: (id) =>
        set((s) => ({
          recentCustomerIds: [id, ...s.recentCustomerIds.filter((cid) => cid !== id)].slice(0, 5),
        })),
      clearRecentCustomers: () => set({ recentCustomerIds: [] }),
      setCustomerListWidth: (customerListWidth) => set({ customerListWidth: Math.round(Math.min(480, Math.max(240, customerListWidth))) }),
      requestNewOpportunity: () => set({ newOpportunityRequested: true }),
      consumeNewOpportunityRequest: () => {
        const pending = get().newOpportunityRequested;
        if (pending) set({ newOpportunityRequested: false });
        return pending;
      },
    }),
    {
      name: 'crm-ui-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        recentCustomerIds: state.recentCustomerIds,
        customerListWidth: state.customerListWidth,
      }),
    }
  )
);
