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
          <div key={label} className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* Error List */}
      <div>
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Errors</h3>
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/30">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Error</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {syncErrors.map((err) => (
                  <tr key={err.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">{err.syncType}</td>
                    <td className="px-4 py-3 text-destructive">{err.errorMessage}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(err.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {syncErrors.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">No errors</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
          className="w-16 h-8 rounded-md border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          min={1}
        />
        <span className="text-sm">days</span>
        <Button variant="outline" size="sm" onClick={handlePurge}>Purge</Button>
      </div>
    </div>
  );
}
