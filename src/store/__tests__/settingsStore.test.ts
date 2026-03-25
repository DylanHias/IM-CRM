import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetAll();
  });

  const store = () => useSettingsStore.getState();

  it('has correct default values', () => {
    expect(store().theme).toBe('light');
    expect(store().accentColor).toBe('blue');
    expect(store().compactMode).toBe(false);
    expect(store().defaultActivityType).toBe('meeting');
    expect(store().itemsPerPage).toBe(50);
    expect(store().noRecentActivityDays).toBe(90);
    expect(store().followUpReminderDays).toBe(1);
    expect(store().autoSyncOnLaunch).toBe(true);
    expect(store().syncIntervalMinutes).toBe(15);
    expect(store().defaultExportFormat).toBe('xlsx');
  });

  it('updateSetting updates a single setting', () => {
    store().updateSetting('theme', 'dark');
    expect(store().theme).toBe('dark');
  });

  it('resetSection appearance resets only appearance keys', () => {
    store().updateSetting('theme', 'dark');
    store().updateSetting('compactMode', true);
    store().updateSetting('itemsPerPage', 100);
    store().resetSection('appearance');
    expect(store().theme).toBe('light');
    expect(store().compactMode).toBe(false);
    expect(store().itemsPerPage).toBe(100); // unaffected
  });

  it('resetSection dataDefaults resets only data default keys', () => {
    store().updateSetting('defaultActivityType', 'call');
    store().updateSetting('itemsPerPage', 100);
    store().updateSetting('theme', 'dark');
    store().resetSection('dataDefaults');
    expect(store().defaultActivityType).toBe('meeting');
    expect(store().itemsPerPage).toBe(50);
    expect(store().theme).toBe('dark'); // unaffected
  });

  it('resetSection notifications', () => {
    store().updateSetting('followUpReminderDays', 7);
    store().resetSection('notifications');
    expect(store().followUpReminderDays).toBe(1);
  });

  it('resetSection sync', () => {
    store().updateSetting('syncIntervalMinutes', 60);
    store().resetSection('sync');
    expect(store().syncIntervalMinutes).toBe(15);
  });

  it('resetSection dataManagement', () => {
    store().updateSetting('defaultExportFormat', 'csv');
    store().resetSection('dataManagement');
    expect(store().defaultExportFormat).toBe('xlsx');
  });

  it('resetAll resets everything', () => {
    store().updateSetting('theme', 'dark');
    store().updateSetting('itemsPerPage', 100);
    store().updateSetting('syncIntervalMinutes', 60);
    store().resetAll();
    expect(store().theme).toBe('light');
    expect(store().itemsPerPage).toBe(50);
    expect(store().syncIntervalMinutes).toBe(15);
  });

  it('hydrateFromDb is a no-op outside Tauri', async () => {
    // isTauriApp() returns false in test env, so hydrateFromDb should return early
    await store().hydrateFromDb();
    // should not throw, state unchanged
    expect(store().theme).toBe('light');
  });
});
