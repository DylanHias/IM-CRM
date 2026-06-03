import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import type { SortBy } from '@/store/customerStore';
import type { Stage } from '@/lib/opportunityRules';

type Theme = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink';
export type Density = 'comfortable' | 'cozy' | 'compact';
export type FontScale = 'sm' | 'md' | 'lg';
export type FontFamily = 'sans' | 'system' | 'serif' | 'mono';
export type TableRowDensity = 'comfortable' | 'cozy' | 'compact';
type ActivityType = 'meeting' | 'visit' | 'call' | 'note';
type ActivityStatusDefault = 'open' | 'completed';
type CallDirection = 'outgoing' | 'incoming';
type OpportunityCurrency = 'EUR' | 'USD';
type OpportunityCountry = 'Belgium' | 'Netherlands';
export type SyncToastVerbosity = 'silent' | 'errors' | 'all';

export type CustomKeybinding = { key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean };

export type SidebarTab = '/dashboard' | '/customers' | '/sync' | '/followups' | '/opportunities' | '/revenue-overview' | '/insights' | '/analytics' | '/timeline';

export const DEFAULT_SIDEBAR_ORDER: SidebarTab[] = [
  '/dashboard',
  '/customers',
  '/revenue-overview',
  '/insights',
  '/followups',
  '/analytics',
  '/timeline',
  '/sync',
  '/opportunities',
];

interface SettingsState {
  // Appearance
  theme: Theme;
  accentColor: AccentColor;
  customAccentHex: string | null;
  compactMode: boolean;
  density: Density;
  fontScale: FontScale;
  fontFamily: FontFamily;
  tableRowDensity: TableRowDensity;
  highContrast: boolean;
  reduceMotion: boolean;
  autoThemeByTime: boolean;
  autoThemeDarkStartHour: number;
  autoThemeLightStartHour: number;
  defaultLandingTab: SidebarTab;
  sidebarDefaultExpanded: boolean;
  sidebarRememberLastState: boolean;
  sidebarOrder: SidebarTab[];
  sidebarHiddenTabs: SidebarTab[];

  // Data & Defaults
  defaultActivityType: ActivityType;
  defaultActivityStatus: ActivityStatusDefault;
  defaultCallDirection: CallDirection;
  defaultAppointmentDurationHours: number;
  defaultCustomerSort: SortBy;
  defaultCustomerFilterOwner: boolean;
  noRecentActivityDays: number;
  defaultOpportunityCurrency: OpportunityCurrency;
  defaultOpportunityCountry: OpportunityCountry;
  defaultOpportunityStage: Stage;
  defaultOpportunityExpirationDays: number;
  defaultFollowUpDueDays: number;

  // Notifications & Reminders
  followUpReminderDays: number;
  overdueAlertsOnLaunch: boolean;
  dueTodayAlertsOnLaunch: boolean;
  opportunityStaleReminderDays: number;
  opportunityExpiringReminderDays: number;
  dailyDigestOnLaunch: boolean;
  showConnectivityToasts: boolean;
  showUpdateToasts: boolean;
  muteAllNonCriticalToasts: boolean;
  syncToastVerbosity: SyncToastVerbosity;
  syncFailureNotificationThreshold: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  nativeOsNotifications: boolean;
  soundOnAlertEnabled: boolean;
  toastDurationSeconds: number;

  // Sync
  autoSyncOnLaunch: boolean;
  syncPaused: boolean;
  syncOnWindowFocus: boolean;
  syncIntervalMinutes: number;
  syncPendingIntervalMinutes: number;
  powerBiRefreshIntervalMinutes: number;
  syncScopeD365: boolean;
  syncScopePowerBi: boolean;
  syncScopePushPending: boolean;
  syncHistoryRetentionDays: number;
  showSyncToasts: boolean;

  // Data Management
  mockDataEnabled: boolean;

  // Table Columns
  tableColumns: Record<string, { order: string[]; hidden: string[] }>;

  // Keybindings
  customKeybindings: Record<string, CustomKeybinding>;

  // Onboarding
  hasCompletedWalkthrough: boolean;
  walkthroughActive: boolean;

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
  customAccentHex: null as string | null,
  compactMode: false,
  density: 'comfortable' as Density,
  fontScale: 'md' as FontScale,
  fontFamily: 'sans' as FontFamily,
  tableRowDensity: 'comfortable' as TableRowDensity,
  highContrast: false,
  reduceMotion: false,
  autoThemeByTime: false,
  autoThemeDarkStartHour: 19,
  autoThemeLightStartHour: 7,
  defaultLandingTab: '/dashboard' as SidebarTab,
  sidebarDefaultExpanded: false,
  sidebarRememberLastState: true,
  sidebarOrder: DEFAULT_SIDEBAR_ORDER as SidebarTab[],
  sidebarHiddenTabs: [] as SidebarTab[],
};

const DATA_DEFAULTS = {
  defaultActivityType: 'meeting' as ActivityType,
  defaultActivityStatus: 'open' as ActivityStatusDefault,
  defaultCallDirection: 'outgoing' as CallDirection,
  defaultAppointmentDurationHours: 1,
  defaultCustomerSort: 'lastActivity' as SortBy,
  defaultCustomerFilterOwner: false,
  noRecentActivityDays: 90,
  defaultOpportunityCurrency: 'USD' as OpportunityCurrency,
  defaultOpportunityCountry: 'Belgium' as OpportunityCountry,
  defaultOpportunityStage: 'Prospecting' as Stage,
  defaultOpportunityExpirationDays: 7,
  defaultFollowUpDueDays: 1,
};

const NOTIFICATION_DEFAULTS = {
  followUpReminderDays: 1,
  overdueAlertsOnLaunch: true,
  dueTodayAlertsOnLaunch: true,
  showSyncToasts: true,
  showConnectivityToasts: true,
  showUpdateToasts: true,
  opportunityStaleReminderDays: 30,
  opportunityExpiringReminderDays: 14,
  dailyDigestOnLaunch: false,
  muteAllNonCriticalToasts: false,
  syncToastVerbosity: 'all' as SyncToastVerbosity,
  syncFailureNotificationThreshold: 1,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  nativeOsNotifications: false,
  soundOnAlertEnabled: false,
  toastDurationSeconds: 4,
};

const SYNC_DEFAULTS = {
  autoSyncOnLaunch: false,
  syncPaused: false,
  syncOnWindowFocus: false,
  syncIntervalMinutes: 30,
  syncPendingIntervalMinutes: 15,
  powerBiRefreshIntervalMinutes: 120,
  syncScopeD365: true,
  syncScopePowerBi: true,
  syncScopePushPending: true,
  syncHistoryRetentionDays: 90,
};

const DATA_MANAGEMENT_DEFAULTS = {
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
      walkthroughActive: false,

      updateSetting: (key, value) => {
        set({ [key]: value } as Partial<SettingsState>);
        if ((SETTINGS_KEYS as string[]).includes(String(key))) {
          persistToDb(String(key), value);
        }
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
          if (patch.sidebarHiddenTabs) {
            patch.sidebarHiddenTabs = (patch.sidebarHiddenTabs as SidebarTab[]).filter((t) =>
              (DEFAULT_SIDEBAR_ORDER as string[]).includes(t)
            );
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
        const p = persisted as Partial<SettingsState>;
        const raw = p.sidebarOrder;
        if (raw) {
          const valid = raw.filter((t) => (DEFAULT_SIDEBAR_ORDER as string[]).includes(t));
          const missing = DEFAULT_SIDEBAR_ORDER.filter((t) => !valid.includes(t));
          merged.sidebarOrder = [...valid, ...missing];
        }
        const rawHidden = p.sidebarHiddenTabs;
        if (rawHidden) {
          merged.sidebarHiddenTabs = rawHidden.filter((t) => (DEFAULT_SIDEBAR_ORDER as string[]).includes(t));
        }
        // Migrate legacy compactMode → density when density was never set
        if (p.density === undefined && p.compactMode === true) {
          merged.density = 'compact';
        }
        return merged;
      },
    }
  )
);
