'use client';

import { useState } from 'react';
import { Download, Upload, Loader2, Database, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRevenueStore } from '@/store/revenueStore';
import { loadRevenueFromDb } from '@/lib/integrations/powerbi/revenueService';
import { isTauriApp } from '@/lib/utils/offlineUtils';

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return 'never';
  return d.toLocaleString();
}

export function RevenueCacheTransfer() {
  const byBcn = useRevenueStore((s) => s.byBcn);
  const lastRefreshedAt = useRevenueStore((s) => s.lastRefreshedAt);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function handleExport() {
    if (isExporting || isImporting) return;
    if (!isTauriApp()) {
      toast.error('Export only available in the desktop app');
      return;
    }

    const date = new Date().toISOString().split('T')[0];
    const { save } = await import('@tauri-apps/plugin-dialog');
    const savePath = await save({
      defaultPath: `revenue-cache-${date}.imrev`,
      filters: [{ name: 'IM-CRM Revenue Cache', extensions: ['imrev'] }],
    });
    if (!savePath) return;

    setIsExporting(true);
    const toastId = toast.loading('Exporting…');
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const count = await invoke<number>('export_revenue_cache', {
        path: savePath,
        exportedAt: new Date().toISOString(),
      });
      toast.success('Export complete', {
        id: toastId,
        description: `${count.toLocaleString()} customer${count === 1 ? '' : 's'} saved to ${savePath}`,
      });
    } catch (err) {
      console.error('[data] Revenue cache export failed:', err);
      toast.error('Export failed', {
        id: toastId,
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleImport() {
    if (isExporting || isImporting) return;
    if (!isTauriApp()) {
      toast.error('Import only available in the desktop app');
      return;
    }

    const { open } = await import('@tauri-apps/plugin-dialog');
    const openPath = await open({
      multiple: false,
      filters: [{ name: 'IM-CRM Revenue Cache', extensions: ['imrev'] }],
    });
    if (!openPath || Array.isArray(openPath)) return;

    setIsImporting(true);
    const toastId = toast.loading('Importing…');
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<{
        rowCount: number;
        lastRefreshedAt: string | null;
        exportedAt: string | null;
      }>('import_revenue_cache', { path: openPath });

      await loadRevenueFromDb();

      const refreshedNote = result.lastRefreshedAt
        ? ` · last refreshed ${formatTimestamp(result.lastRefreshedAt)}`
        : '';
      toast.success('Import complete', {
        id: toastId,
        description: `${result.rowCount.toLocaleString()} customer${result.rowCount === 1 ? '' : 's'} loaded${refreshedNote}`,
      });
    } catch (err) {
      console.error('[data] Revenue cache import failed:', err);
      toast.error('Import failed', {
        id: toastId,
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsImporting(false);
    }
  }

  const cachedCount = byBcn.size;
  const busy = isExporting || isImporting;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Revenue Cache Transfer</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Export your locally cached Power BI revenue data to a file you can send to a colleague.
          On their machine, importing the file fills in the same ARR numbers without needing Power BI access.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleExport} disabled={busy || cachedCount === 0}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isExporting ? 'Exporting…' : 'Export to file'}
        </Button>

        <Button variant="outline" onClick={handleImport} disabled={busy}>
          {isImporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {isImporting ? 'Importing…' : 'Import from file'}
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database size={14} className="shrink-0" />
          <span>
            <span className="text-foreground font-medium tabular-nums">{cachedCount.toLocaleString()}</span>
            {' '}customer{cachedCount === 1 ? '' : 's'} cached · last refreshed {formatTimestamp(lastRefreshedAt)}
          </span>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
        <AlertCircle size={14} className="mt-0.5 shrink-0 text-warning" />
        <span className="break-words">
          Importing replaces the existing revenue cache. Your colleague&apos;s Refresh button stays available — running it will overwrite the imported data with fresh Power BI numbers.
        </span>
      </div>
    </div>
  );
}
