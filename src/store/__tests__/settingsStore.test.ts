import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, DEFAULT_SIDEBAR_ORDER } from '../settingsStore';
import type { SidebarTab } from '../settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetAll();
  });

  const store = () => useSettingsStore.getState();

  it('has correct default values', () => {
    expect(store().theme).toBe('light');
    expect(store().accentColor).toBe('blue');
    expect(store().compactMode).toBe(false);
    expect(store().sidebarDefaultExpanded).toBe(false);
    expect(store().sidebarOrder).toEqual(DEFAULT_SIDEBAR_ORDER);
    expect(store().defaultActivityType).toBe('meeting');
    expect(store().defaultCustomerSort).toBe('lastActivity');
    expect(store().defaultCustomerFilterOwner).toBe(false);

    expect(store().noRecentActivityDays).toBe(90);
    expect(store().followUpReminderDays).toBe(1);
    expect(store().overdueAlertsOnLaunch).toBe(true);
    expect(store().dueTodayAlertsOnLaunch).toBe(true);
    expect(store().showSyncToasts).toBe(true);
    expect(store().showConnectivityToasts).toBe(true);
    expect(store().showUpdateToasts).toBe(true);
    expect(store().opportunityStaleReminderDays).toBe(30);
    expect(store().autoSyncOnLaunch).toBe(false);
    expect(store().syncIntervalMinutes).toBe(30);
    expect(store().defaultExportFormat).toBe('xlsx');
    expect(store().mockDataEnabled).toBe(false);
  });

  it('updateSetting updates a single setting', () => {
    store().updateSetting('theme', 'dark');
    expect(store().theme).toBe('dark');
  });

  describe('resetSection appearance', () => {
    it('resets all appearance keys to defaults', () => {
      const reordered: SidebarTab[] = ['/sync', '/customers', '/followups', '/opportunities', '/invoices', '/revenue-overview'];
      store().updateSetting('theme', 'dark');
      store().updateSetting('accentColor', 'red');
      store().updateSetting('compactMode', true);
      store().updateSetting('sidebarDefaultExpanded', true);
      store().updateSetting('sidebarOrder', reordered);

      store().resetSection('appearance');

      expect(store().theme).toBe('light');
      expect(store().accentColor).toBe('blue');
      expect(store().compactMode).toBe(false);
      expect(store().sidebarDefaultExpanded).toBe(false);
      expect(store().sidebarOrder).toEqual(DEFAULT_SIDEBAR_ORDER);
    });

    it('does not affect other sections', () => {

      store().updateSetting('syncIntervalMinutes', 60);
      store().updateSetting('followUpReminderDays', 7);

      store().resetSection('appearance');

      expect(store().syncIntervalMinutes).toBe(60);
      expect(store().followUpReminderDays).toBe(7);
    });
  });

  describe('resetSection dataDefaults', () => {
    it('resets all data default keys', () => {
      store().updateSetting('defaultActivityType', 'call');
      store().updateSetting('defaultCustomerSort', 'name');
      store().updateSetting('defaultCustomerFilterOwner', true);

      store().updateSetting('noRecentActivityDays', 30);

      store().resetSection('dataDefaults');

      expect(store().defaultActivityType).toBe('meeting');
      expect(store().defaultCustomerSort).toBe('lastActivity');
      expect(store().defaultCustomerFilterOwner).toBe(false);
  
      expect(store().noRecentActivityDays).toBe(90);
    });

    it('does not affect other sections', () => {
      store().updateSetting('theme', 'dark');
      store().updateSetting('autoSyncOnLaunch', false);

      store().resetSection('dataDefaults');

      expect(store().theme).toBe('dark');
      expect(store().autoSyncOnLaunch).toBe(false);
    });
  });

  describe('resetSection notifications', () => {
    it('resets all notification keys', () => {
      store().updateSetting('followUpReminderDays', 7);
      store().updateSetting('overdueAlertsOnLaunch', false);
      store().updateSetting('dueTodayAlertsOnLaunch', false);
      store().updateSetting('showSyncToasts', false);
      store().updateSetting('showConnectivityToasts', false);
      store().updateSetting('showUpdateToasts', false);
      store().updateSetting('opportunityStaleReminderDays', 90);

      store().resetSection('notifications');

      expect(store().followUpReminderDays).toBe(1);
      expect(store().overdueAlertsOnLaunch).toBe(true);
      expect(store().dueTodayAlertsOnLaunch).toBe(true);
      expect(store().showSyncToasts).toBe(true);
      expect(store().showConnectivityToasts).toBe(true);
      expect(store().showUpdateToasts).toBe(true);
      expect(store().opportunityStaleReminderDays).toBe(30);
    });

    it('does not affect other sections', () => {
      store().updateSetting('theme', 'dark');


      store().resetSection('notifications');

      expect(store().theme).toBe('dark');
    });
  });

  describe('resetSection sync', () => {
    it('resets all sync keys', () => {
      store().updateSetting('autoSyncOnLaunch', false);
      store().updateSetting('syncIntervalMinutes', 60);

      store().resetSection('sync');

      expect(store().autoSyncOnLaunch).toBe(false);
      expect(store().syncIntervalMinutes).toBe(30);
    });

    it('does not affect other sections', () => {
      store().updateSetting('theme', 'dark');
      store().updateSetting('followUpReminderDays', 7);

      store().resetSection('sync');

      expect(store().theme).toBe('dark');
      expect(store().followUpReminderDays).toBe(7);
    });
  });

  describe('resetSection dataManagement', () => {
    it('resets all data management keys', () => {
      store().updateSetting('defaultExportFormat', 'csv');
      store().updateSetting('mockDataEnabled', true);

      store().resetSection('dataManagement');

      expect(store().defaultExportFormat).toBe('xlsx');
      expect(store().mockDataEnabled).toBe(false);
    });

    it('does not affect other sections', () => {
      store().updateSetting('theme', 'dark');

      store().resetSection('dataManagement');

      expect(store().theme).toBe('dark');
    });
  });

  describe('resetAll', () => {
    it('resets every setting across all sections', () => {
      // Change at least one setting per section
      store().updateSetting('theme', 'dark');
      store().updateSetting('accentColor', 'red');
      store().updateSetting('compactMode', true);
      store().updateSetting('defaultActivityType', 'call');

      store().updateSetting('followUpReminderDays', 7);
      store().updateSetting('overdueAlertsOnLaunch', false);
      store().updateSetting('showSyncToasts', false);
      store().updateSetting('autoSyncOnLaunch', false);
      store().updateSetting('syncIntervalMinutes', 60);
      store().updateSetting('defaultExportFormat', 'csv');
      store().updateSetting('mockDataEnabled', true);

      store().resetAll();

      // Appearance
      expect(store().theme).toBe('light');
      expect(store().accentColor).toBe('blue');
      expect(store().compactMode).toBe(false);
      // Data & Defaults
      expect(store().defaultActivityType).toBe('meeting');
  
      // Notifications
      expect(store().followUpReminderDays).toBe(1);
      expect(store().overdueAlertsOnLaunch).toBe(true);
      expect(store().showSyncToasts).toBe(true);
      // Sync
      expect(store().autoSyncOnLaunch).toBe(false);
      expect(store().syncIntervalMinutes).toBe(30);
      // Data Management
      expect(store().defaultExportFormat).toBe('xlsx');
      expect(store().mockDataEnabled).toBe(false);
    });
  });

  it('hydrateFromDb is a no-op outside Tauri', async () => {
    await store().hydrateFromDb();
    expect(store().theme).toBe('light');
  });
});
