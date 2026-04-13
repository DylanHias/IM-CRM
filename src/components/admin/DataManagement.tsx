'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { Download, Trash2, Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { toast } from 'sonner';

export function DataManagement() {
  const { tableStats, isLoading, loadDataManagement } = useAdminStore();
  const [syncPurgeDays, setSyncPurgeDays] = useState(90);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadDataManagement();
  }, [loadDataManagement]);

  const handleExportAll = async () => {
    if (!isTauriApp()) return;
    const datestamp = new Date().toISOString().split('T')[0];

    // Pick save location first — user gets immediate feedback
    const { save } = await import('@tauri-apps/plugin-dialog');
    const path = await save({
      defaultPath: `im-crm-export-${datestamp}.xlsx`,
      filters: [{ name: 'Excel Spreadsheet', extensions: ['xlsx'] }],
    });
    if (!path) return;

    setIsExporting(true);
    const toastId = toast.loading('Exporting…');

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      // Rust reads the DB, generates XLSX, and writes to disk — zero JS-heap allocation
      await invoke('export_db_all', { path });
      toast.success('Export complete', { id: toastId, description: path });
    } catch (err) {
      console.error('[data] Export failed:', err);
      toast.error('Export failed', {
        id: toastId,
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handlePurgeSync = async () => {
    if (!isTauriApp()) return;
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - syncPurgeDays);
      const { purgeSyncRecordsBefore } = await import('@/lib/db/queries/adminAnalytics');
      const deleted = await purgeSyncRecordsBefore(cutoff.toISOString());
      alert(`Purged ${deleted} sync records.`);
      await loadDataManagement();
    } catch (err) {
      console.error('[sync] Purge sync records failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold">Data Management</h2>

      {/* Table Stats */}
      <div>
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Table Statistics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {tableStats.map(({ tableName, rowCount }) => (
            <div key={tableName} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card p-2.5 shadow-sm">
              <Database size={14} className="text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{tableName}</p>
                <p className="text-sm font-semibold">{rowCount.toLocaleString()}</p>
              </div>
            </div>
          ))}
          {tableStats.length === 0 && (
            <p className="col-span-full py-4 text-center text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : 'No data'}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div>
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportAll} disabled={isExporting}>
            {isExporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span className="ml-1.5">{isExporting ? 'Exporting…' : 'Export All Data'}</span>
          </Button>
        </div>
      </div>

      {/* Purge Sections */}
      <div>
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purge Old Data</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Trash2 size={14} className="text-muted-foreground" />
            <span className="text-sm">Sync records older than</span>
            <input
              type="number"
              value={syncPurgeDays}
              onChange={(e) => setSyncPurgeDays(Number(e.target.value))}
              className="w-16 h-8 rounded-md border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              min={1}
            />
            <span className="text-sm">days</span>
            <Button variant="outline" size="sm" onClick={handlePurgeSync}>Purge</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
