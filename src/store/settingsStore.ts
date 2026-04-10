import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import type { SortBy } from '@/store/customerStore';

type Theme = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink';
type ActivityType = 'meeting' | 'visit' | 'call' | 'note';
type ExportFormat = 'xlsx' | 'csv';

export type CustomKeybinding = { key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean };

export type SidebarTab = '/customers' | '/sync' | '/followups' | '/opportunities' | '/invoices' | '/revenue-overview';

export const DEFAULT_SIDEBAR_ORDER: SidebarTab[] = [
  '/customers',
  '/sync',
  '/followups',
  '/opportunities',
  '/invoices',
  '/revenue-overview',
];

interface SettingsState {
  // Appearance
  theme: Theme;
  accentColor: AccentColor;
  compactMode: boolean;
  sidebarDefaultExpanded: boolean;
  sidebarOrder: SidebarTab[];

  // Data & Defaults
  defaultActivityType: ActivityType;
  defaultCustomerSort: SortBy;
  defaultCustomerFilterOwner: boolean;
  noRecentActivityDays: number;

  // Notifications & Reminders
  followUpReminderDays: number;
  overdueAlertsOnLaunch: boolean;
  dueTodayAlertsOnLaunch: boolean;
  opportunityStaleReminderDays: number;
  showConnectivityToasts: boolean;
  showUpdateToasts: boolean;

  // Sync
  autoSyncOnLaunch: boolean;
  syncIntervalMinutes: number;
  syncPendingIntervalMinutes: number;
  showSyncToasts: boolean;

  // Data Management
  defaultExportFormat: ExportFormat;
  mockDataEnabled: boolean;

  // Table Columns
  tableColumns: Record<string, { order: string[]; hidden: string[] }>;

  // Keybindings
  customKeybindings: Record<string, CustomKeybinding>;

  // Onboarding
  hasCompletedWalkthrough: boolean;

  // Actions
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  resetSection: (section: SettingsSection) => void;
  resetAll: () => void;
  hydrateFromDb: () => Promise<void>;
}

type SettingsSection = 'appearance' | 'dataDefaults' | 'notifications' | 'sync' | 'dataManagement' | 'tableColumns' | 'keybindings';

const APPEARANCE_DEFAULTS = {
  theme: 'light' as Theme,
  accentColor: 'blue' as AccentColor,
  compactMode: false,
  sidebarDefaultExpanded: false,
  sidebarOrder: DEFAULT_SIDEBAR_ORDER as SidebarTab[],
};

const DATA_DEFAULTS = {
  defaultActivityType: 'meeting' as ActivityType,
  defaultCustomerSort: 'lastActivity' as SortBy,
  defaultCustomerFilterOwner: false,
  noRecentActivityDays: 90,
};

const NOTIFICATION_DEFAULTS = {
  followUpReminderDays: 1,
  overdueAlertsOnLaunch: true,
  dueTodayAlertsOnLaunch: true,
  showSyncToasts: true,
  showConnectivityToasts: true,
  showUpdateToasts: true,
  opportunityStaleReminderDays: 30,
};

const SYNC_DEFAULTS = {
  autoSyncOnLaunch: false,
  syncIntervalMinutes: 30,
  syncPendingIntervalMinutes: 15,
};

const DATA_MANAGEMENT_DEFAULTS = {
  defaultExportFormat: 'xlsx' as ExportFormat,
  mockDataEnabled: false,
};

const TABLE_COLUMNS_DEFAULTS = {
  tableColumns: {} as Record<string, { order: string[]; hidden: string[] }>,
};

const KEYBINDINGS_DEFAULTS = {
  customKeybindings: {} as Record<string, CustomKeybinding>,
};

const SECTION_DEFAULTS: Record<SettingsSection, Record<string, unknown>> = {
  appearance: APPEARANCE_DEFAULTS,
  dataDefaults: DATA_DEFAULTS,
  notifications: NOTIFICATION_DEFAULTS,
  sync: SYNC_DEFAULTS,
  dataManagement: DATA_MANAGEMENT_DEFAULTS,
  tableColumns: TABLE_COLUMNS_DEFAULTS,
  keybindings: KEYBINDINGS_DEFAULTS,
};

const ALL_DEFAULTS = {
  ...APPEARANCE_DEFAULTS,
  ...DATA_DEFAULTS,
  ...NOTIFICATION_DEFAULTS,
  ...SYNC_DEFAULTS,
  ...DATA_MANAGEMENT_DEFAULTS,
  ...TABLE_COLUMNS_DEFAULTS,
  ...KEYBINDINGS_DEFAULTS,
  hasCompletedWalkthrough: false,
};

const SETTINGS_KEYS = Object.keys(ALL_DEFAULTS) as (keyof typeof ALL_DEFAULTS)[];

async function persistToDb(key: string, value: unknown): Promise<void> {
  if (!isTauriApp()) return;
  const { setAppSetting } = await import('@/lib/db/queries/sync');
  await setAppSetting(`settings.${key}`, JSON.stringify(value));
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...ALL_DEFAULTS,

      updateSetting: (key, value) => {
        set({ [key]: value } as Partial<SettingsState>);
        persistToDb(String(key), value);
      },

      resetSection: (section) => {
        const defaults = SECTION_DEFAULTS[section];
        set(defaults as Partial<SettingsState>);
        for (const [key, value] of Object.entries(defaults)) {
          persistToDb(key, value);
        }
      },

      resetAll: () => {
        set(ALL_DEFAULTS);
        for (const [key, value] of Object.entries(ALL_DEFAULTS)) {
          persistToDb(key, value);
        }
      },

      hydrateFromDb: async () => {
        if (!isTauriApp()) return;
        try {
          const { getAllAppSettings } = await import('@/lib/db/queries/settings');
          const dbSettings = await getAllAppSettings();
          const patch: Record<string, unknown> = {};
          for (const key of SETTINGS_KEYS) {
            const dbValue = dbSettings[`settings.${key}`];
            if (dbValue !== undefined) {
              try {
                patch[key] = JSON.parse(dbValue);
              } catch {
                // skip malformed values
              }
            }
          }
          if (patch.sidebarOrder) {
            const raw = patch.sidebarOrder as SidebarTab[];
            const valid = raw.filter((t) => (DEFAULT_SIDEBAR_ORDER as string[]).includes(t));
            const missing = DEFAULT_SIDEBAR_ORDER.filter((t) => !valid.includes(t));
            patch.sidebarOrder = [...valid, ...missing];
          }
          if (Object.keys(patch).length > 0) {
            set(patch as Partial<SettingsState>);
          }
        } catch (err) {
          console.error('[settings] Failed to hydrate from DB:', err);
        }
      },
    }),
    {
      name: 'crm-settings-store',
      partialize: (state) => {
        const persisted: Record<string, unknown> = {};
        for (const key of SETTINGS_KEYS) {
          persisted[key] = state[key];
        }
        return persisted;
      },
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<SettingsState>) };
        const raw = (persisted as Partial<SettingsState>).sidebarOrder;
        if (raw) {
          const valid = raw.filter((t) => (DEFAULT_SIDEBAR_ORDER as string[]).includes(t));
          const missing = DEFAULT_SIDEBAR_ORDER.filter((t) => !valid.includes(t));
          merged.sidebarOrder = [...valid, ...missing];
        }
        return merged;
      },
    }
  )
);
