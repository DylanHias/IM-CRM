'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { runFullSync } from '@/lib/sync/syncService';
import { isTauriApp } from '@/lib/utils/offlineUtils';

export function SyncAdministration() {
  const { syncHealth, syncErrors, isLoading, loadSyncAdmin } = useAdminStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [syncing, setSyncing] = useState(false);
  const [purgeDays, setPurgeDays] = useState(90);

  useEffect(() => {
    loadSyncAdmin();
  }, [loadSyncAdmin]);

  const handleForceSync = async () => {
    if (!accessToken || !isTauriApp()) return;
    setSyncing(true);
    try {
      await runFullSync(accessToken);
      await loadSyncAdmin();
    } finally {
      setSyncing(false);
    }
  };

  const handlePurge = async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - purgeDays);
    const { purgeSyncRecordsBefore } = await import('@/lib/db/queries/adminAnalytics');
    const deleted = await purgeSyncRecordsBefore(cutoff.toISOString());
    alert(`Purged ${deleted} sync records.`);
    await loadSyncAdmin();
  };

  const metrics = [
    { label: 'Total Syncs', value: syncHealth?.totalSyncs ?? 0 },
    { label: 'Success Rate', value: `${(syncHealth?.successRate ?? 0).toFixed(1)}%` },
    { label: 'Avg Duration', value: `${((syncHealth?.avgDurationMs ?? 0) / 1000).toFixed(1)}s` },
    { label: 'Records Processed', value: syncHealth?.totalRecordsProcessed ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Sync Administration</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleForceSync} disabled={syncing || isLoading}>
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span className="ml-1.5">Force Re-sync</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-3">
        {metrics.map(({ label, value }) => (
          <div key={label} className="rounded-lg border p-3">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* Error List */}
      <div>
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Errors</h3>
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2 text-left font-medium">Error</th>
                <th className="px-3 py-2 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {syncErrors.map((err) => (
                <tr key={err.id} className="border-b last:border-0">
                  <td className="px-3 py-2">{err.syncType}</td>
                  <td className="px-3 py-2 text-destructive">{err.errorMessage}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(err.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {syncErrors.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">No errors</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purge */}
      <div className="flex items-center gap-3">
        <Trash2 size={14} className="text-muted-foreground" />
        <span className="text-sm">Purge sync records older than</span>
        <input
          type="number"
          value={purgeDays}
          onChange={(e) => setPurgeDays(Number(e.target.value))}
          className="w-16 rounded border bg-background px-2 py-1 text-sm"
          min={1}
        />
        <span className="text-sm">days</span>
        <Button variant="outline" size="sm" onClick={handlePurge}>Purge</Button>
      </div>
    </div>
  );
}
