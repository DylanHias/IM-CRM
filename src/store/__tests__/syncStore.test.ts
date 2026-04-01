import { describe, it, expect, beforeEach } from 'vitest';
import { useSyncStore } from '../syncStore';
import { createSyncError, createSyncRecord } from '@/__tests__/mocks/factories';

describe('syncStore', () => {
  beforeEach(() => {
    useSyncStore.setState({
      isSyncing: false,
      lastD365SyncAt: null,
      syncErrors: [],
      recentRecords: [],
      pendingActivityCount: 0,
      pendingFollowUpCount: 0,
    });
  });

  const store = () => useSyncStore.getState();

  it('setSyncing', () => {
    store().setSyncing(true);
    expect(store().isSyncing).toBe(true);
  });

  it('setLastD365Sync', () => {
    store().setLastD365Sync('2026-03-25T12:00:00.000Z');
    expect(store().lastD365SyncAt).toBe('2026-03-25T12:00:00.000Z');
  });

  it('addSyncError prepends', () => {
    const e1 = createSyncError({ id: '1' });
    const e2 = createSyncError({ id: '2' });
    store().addSyncError(e1);
    store().addSyncError(e2);
    expect(store().syncErrors[0].id).toBe('2');
    expect(store().syncErrors[1].id).toBe('1');
  });

  it('addSyncError caps at 50', () => {
    for (let i = 0; i < 55; i++) {
      store().addSyncError(createSyncError({ id: String(i) }));
    }
    expect(store().syncErrors).toHaveLength(50);
  });

  it('clearSyncErrors', () => {
    store().addSyncError(createSyncError());
    store().clearSyncErrors();
    expect(store().syncErrors).toHaveLength(0);
  });

  it('setRecentRecords', () => {
    const records = [createSyncRecord()];
    store().setRecentRecords(records);
    expect(store().recentRecords).toEqual(records);
  });

  it('setPendingCounts', () => {
    store().setPendingCounts(3, 5);
    expect(store().pendingActivityCount).toBe(3);
    expect(store().pendingFollowUpCount).toBe(5);
  });

  it('initial state defaults', () => {
    expect(store().isSyncing).toBe(false);
    expect(store().lastD365SyncAt).toBeNull();
    expect(store().syncErrors).toHaveLength(0);
    expect(store().pendingActivityCount).toBe(0);
  });
});
