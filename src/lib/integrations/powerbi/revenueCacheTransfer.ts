import { toast } from 'sonner';
import { loadRevenueFromDb } from '@/lib/integrations/powerbi/revenueService';
import { useRevenueInsightsStore } from '@/store/revenueInsightsStore';
import { useCustomerRevenueDetailStore } from '@/store/customerRevenueDetailStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';

export interface ImportRevenueCacheResult {
  rowCount: number;
  lastRefreshedAt: string | null;
  exportedAt: string | null;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return 'never';
  return d.toLocaleString();
}

export async function pickAndImportRevenueCache(): Promise<ImportRevenueCacheResult | null> {
  if (!isTauriApp()) {
    toast.error('Import only available in the desktop app');
    return null;
  }

  const { open } = await import('@tauri-apps/plugin-dialog');
  const openPath = await open({
    multiple: false,
    filters: [{ name: 'IM-CRM Revenue Cache', extensions: ['imrev'] }],
  });
  if (!openPath || Array.isArray(openPath)) return null;

  const toastId = toast.loading('Importing…');
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke<ImportRevenueCacheResult>('import_revenue_cache', { path: openPath });

    await loadRevenueFromDb();

    // Clear cached insights store entries so hooks re-hydrate from the
    // freshly-imported DB rows instead of showing the stale PowerBiUnavailable
    // state captured before the import.
    useRevenueInsightsStore.getState().resetAll();
    useCustomerRevenueDetailStore.getState().resetAll();

    const refreshedNote = result.lastRefreshedAt
      ? ` · last refreshed ${formatTimestamp(result.lastRefreshedAt)}`
      : '';
    toast.success('Import complete', {
      id: toastId,
      description: `${result.rowCount.toLocaleString()} customer${result.rowCount === 1 ? '' : 's'} loaded${refreshedNote}`,
    });
    return result;
  } catch (err) {
    console.error('[data] Revenue cache import failed:', err);
    toast.error('Import failed', {
      id: toastId,
      description: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
