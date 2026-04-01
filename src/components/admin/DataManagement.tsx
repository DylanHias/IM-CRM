'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { Download, Trash2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { exportFile } from '@/lib/utils/exportFile';
import { useSettingsStore } from '@/store/settingsStore';

export function DataManagement() {
  const { tableStats, isLoading, loadDataManagement } = useAdminStore();
  const exportFormat = useSettingsStore((s) => s.defaultExportFormat);
  const [auditPurgeDays, setAuditPurgeDays] = useState(180);
  const [syncPurgeDays, setSyncPurgeDays] = useState(90);

  useEffect(() => {
    loadDataManagement();
  }, [loadDataManagement]);

  const handleExportAll = async () => {
    if (!isTauriApp()) return;
    try {
      const { getDb } = await import('@/lib/db/client');
      const db = await getDb();
      const { utils, write } = await import('xlsx');
      const wb = utils.book_new();

      const tables = ['customers', 'contacts', 'activities', 'follow_ups', 'opportunities'];
      for (const table of tables) {
        try {
          const rows = await db.select<Record<string, unknown>[]>(`SELECT * FROM ${table}`);
          const ws = utils.json_to_sheet(rows);
          utils.book_append_sheet(wb, ws, table);
        } catch {
          // Table might not exist
        }
      }

      const datestamp = new Date().toISOString().split('T')[0];
      const isCsv = exportFormat === 'csv';
      const bookType = isCsv ? 'csv' : 'xlsx';
      const buffer = write(wb, { bookType, type: 'array' }) as ArrayBuffer;

      await exportFile({
        defaultName: `im-crm-export-${datestamp}.${bookType}`,
        filterLabel: isCsv ? 'CSV File' : 'Excel Spreadsheet',
        extensions: [bookType],
        data: buffer,
      });
    } catch (err) {
      console.error('[data] Export failed:', err);
    }
  };

  const handlePurgeAudit = async () => {
    if (!isTauriApp()) return;
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - auditPurgeDays);
      const { purgeAuditLogBefore } = await import('@/lib/db/queries/auditLog');
      const deleted = await purgeAuditLogBefore(cutoff.toISOString());
      alert(`Purged ${deleted} audit log entries.`);
      await loadDataManagement();
    } catch (err) {
      console.error('[audit] Purge audit log failed:', err);
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
          <Button variant="outline" size="sm" onClick={handleExportAll}>
            <Download size={14} />
            <span className="ml-1.5">Export All Data ({exportFormat})</span>
          </Button>
        </div>
      </div>

      {/* Purge Sections */}
      <div>
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Purge Old Data</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Trash2 size={14} className="text-muted-foreground" />
            <span className="text-sm">Audit log older than</span>
            <input
              type="number"
              value={auditPurgeDays}
              onChange={(e) => setAuditPurgeDays(Number(e.target.value))}
              className="w-16 h-8 rounded-md border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              min={1}
            />
            <span className="text-sm">days</span>
            <Button variant="outline" size="sm" onClick={handlePurgeAudit}>Purge</Button>
          </div>
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
