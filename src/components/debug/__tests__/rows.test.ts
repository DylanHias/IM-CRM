import { describe, expect, it } from 'vitest';
import { toConsoleRow } from '../ConsoleViewer';
import { toSyncLogRow } from '../SyncLogs';
import { createSyncRecord } from '@/__tests__/mocks/factories';

describe('toConsoleRow', () => {
  it('splits the tag from the message and maps error to ERROR', () => {
    const row = toConsoleRow({ id: 7, timestamp: new Date(2026, 9, 14, 9, 5, 3, 42).getTime(), level: 'error', message: '[sync] Push failed: 401', tag: '[sync]' });
    expect(row).toMatchObject({ id: 7, time: '09:05:03.042', level: 'err', levelLabel: 'ERROR', source: 'sync', message: 'Push failed: 401' });
  });

  it('uses "app" when there is no tag', () => {
    expect(toConsoleRow({ id: 1, timestamp: 0, level: 'info', message: 'Ready', tag: null }).source).toBe('app');
  });
});

describe('toSyncLogRow', () => {
  it('summarises a successful run with counts and duration', () => {
    const row = toSyncLogRow(createSyncRecord({ status: 'success', recordsPulled: 1284, recordsPushed: 3, startedAt: '2026-10-14T09:41:30.000Z', finishedAt: '2026-10-14T09:41:33.100Z' }));
    expect(row).toMatchObject({ level: 'info', levelLabel: 'SUCCESS', source: 'Dynamics 365', message: '1,284 pulled · 3 pushed in 3.1s' });
  });

  it('puts the error first and the counts in the detail', () => {
    const row = toSyncLogRow(createSyncRecord({ status: 'error', syncType: 'push_opportunities', errorMessage: 'Field is required', recordsPulled: 0, recordsPushed: 0, finishedAt: null }));
    expect(row).toMatchObject({ level: 'err', source: 'Push opportunities', message: 'Field is required', detail: '0 pulled · 0 pushed' });
  });
});
