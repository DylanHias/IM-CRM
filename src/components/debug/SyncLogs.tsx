'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { format, parseISO } from 'date-fns';
import { RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { LogView, type LogRow, type LogRowLevel } from '@/components/debug/LogView';
import { queryRecentSyncRecords } from '@/lib/db/queries/sync';
import { resetSyncWatermark } from '@/lib/sync/syncService';
import { SYNC_TYPE_LABELS } from '@/lib/sync/historySummary';
import { useSync } from '@/hooks/useSync';
import { useSettingsStore } from '@/store/settingsStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import type { SyncRecord, SyncStatus } from '@/types/sync';

const STATUS_LEVEL: Record<SyncStatus, LogRowLevel> = { success: 'info', partial: 'warn', error: 'err', running: 'log' };

export function toSyncLogRow(r: SyncRecord): LogRow {
  const counts = `${r.recordsPulled.toLocaleString('en')} pulled · ${r.recordsPushed.toLocaleString('en')} pushed`;
  const secs = r.finishedAt ? (parseISO(r.finishedAt).getTime() - parseISO(r.startedAt).getTime()) / 1000 : null;
  const summary = r.status === 'running' ? 'Started' : secs !== null && secs >= 0 ? `${counts} in ${secs.toFixed(1)}s` : counts;
  return {
    id: r.id,
    time: format(parseISO(r.startedAt), 'dd MMM HH:mm:ss'),
    level: STATUS_LEVEL[r.status],
    levelLabel: r.status.toUpperCase(),
    source: SYNC_TYPE_LABELS[r.syncType] ?? r.syncType,
    message: r.errorMessage ?? summary,
    detail: r.errorMessage ? summary : undefined,
  };
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'err', label: 'Errors', level: 'err' as const },
  { value: 'warn', label: 'Partial', level: 'warn' as const },
  { value: 'info', label: 'Success', level: 'info' as const },
];

export function SyncLogs({ tabs }: { tabs: ReactNode }) {
  const { triggerSync, isSyncing } = useSync();
  const retentionDays = useSettingsStore((s) => s.syncHistoryRetentionDays);
  const [records, setRecords] = useState<SyncRecord[]>([]);
  const [forcing, setForcing] = useState(false);

  const load = useCallback(async () => {
    if (!isTauriApp()) return;
    try {
      setRecords(await queryRecentSyncRecords(500));
    } catch (err) {
      console.error('[sync] Load sync logs failed:', err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, isSyncing]);

  const rows = useMemo(() => records.map(toSyncLogRow), [records]);

  const forceResync = async () => {
    if (!isTauriApp() || isSyncing) return;
    setForcing(true);
    try {
      await resetSyncWatermark();
      await triggerSync({ d365: true, powerBi: true, pushPending: true });
      await load();
    } catch (err) {
      console.error('[sync] Force re-sync failed:', err);
      toast.error('Sync failed', { description: 'Something went wrong — try again later' });
    } finally {
      setForcing(false);
    }
  };

  const purge = async () => {
    if (!isTauriApp()) return;
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);
      const { purgeSyncRecordsBefore } = await import('@/lib/db/queries/adminAnalytics');
      const deleted = await purgeSyncRecordsBefore(cutoff.toISOString());
      toast.success(`Purged ${deleted} sync ${deleted === 1 ? 'record' : 'records'}`);
      await load();
    } catch (err) {
      console.error('[sync] Purge sync records failed:', err);
      toast.error('Could not purge sync records');
    }
  };

  const busy = forcing || isSyncing;

  return (
    <LogView
      title="Debug"
      barStart={tabs}
      rows={rows}
      filters={FILTERS}
      filterLabel="Status"
      levelHeader="Status"
      searchPlaceholder="Search sync logs…"
      empty={{ icon: RefreshCw, title: 'No sync logs', description: 'Nothing matches this search or status.' }}
      actions={() => (
        <>
          <ConfirmPopover message={`Delete sync records older than ${retentionDays} days?`} confirmLabel="Purge" onConfirm={purge}>
            <Button variant="outline">
              <Trash2 size={13} />
              Purge old
            </Button>
          </ConfirmPopover>
          <Button onClick={forceResync} disabled={busy}>
            <RefreshCw size={13} className={busy ? 'animate-spin' : ''} />
            {busy ? 'Syncing…' : 'Force re-sync'}
          </Button>
        </>
      )}
    />
  );
}
