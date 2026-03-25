'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { Download, Trash2, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DataManagement() {
  const { tableStats, isLoading, loadDataManagement } = useAdminStore();
  const [auditPurgeDays, setAuditPurgeDays] = useState(180);
  const [syncPurgeDays, setSyncPurgeDays] = useState(90);

  useEffect(() => {
    loadDataManagement();
  }, [loadDataManagement]);

  const handleExportAll = async () => {
    try {
      const { getDb } = await import('@/lib/db/client');
      const db = await getDb();
      const { utils, writeFile } = await import('xlsx');
      const wb = utils.book_new();

      const tables = ['customers', 'contacts', 'activities', 'follow_ups', 'opportunities', 'trainings'];
      for (const table of tables) {
        try {
          const rows = await db.select<Record<string, unknown>[]>(`SELECT * FROM ${table}`);
          const ws = utils.json_to_sheet(rows);
          utils.book_append_sheet(wb, ws, table);
        } catch {
          // Table might not exist
        }
      }

      writeFile(wb, `im-crm-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Check console for details.');
    }
  };

  const handlePurgeAudit = async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - auditPurgeDays);
    const { purgeAuditLogBefore } = await import('@/lib/db/queries/auditLog');
    const deleted = await purgeAuditLogBefore(cutoff.toISOString());
    alert(`Purged ${deleted} audit log entries.`);
    await loadDataManagement();
  };

  const handlePurgeSync = async () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - syncPurgeDays);
    const { purgeSyncRecordsBefore } = await import('@/lib/db/queries/adminAnalytics');
    const deleted = await purgeSyncRecordsBefore(cutoff.toISOString());
    alert(`Purged ${deleted} sync records.`);
    await loadDataManagement();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold">Data Management</h2>

      {/* Table Stats */}
      <div>
        <h3 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Table Statistics</h3>
        <div className="grid grid-cols-4 gap-2">
          {tableStats.map(({ tableName, rowCount }) => (
            <div key={tableName} className="flex items-center gap-2 rounded-lg border p-2.5">
              <Database size={14} className="text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{tableName}</p>
                <p className="text-sm font-semibold">{rowCount.toLocaleString()}</p>
              </div>
            </div>
          ))}
          {tableStats.length === 0 && (
            <p className="col-span-4 py-4 text-center text-sm text-muted-foreground">
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
            <span className="ml-1.5">Export All Data (xlsx)</span>
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
              className="w-16 rounded border bg-background px-2 py-1 text-sm"
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
              className="w-16 rounded border bg-background px-2 py-1 text-sm"
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
