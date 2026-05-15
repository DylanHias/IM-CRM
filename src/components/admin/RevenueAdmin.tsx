'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Loader2, AlertCircle, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRevenueStore } from '@/store/revenueStore';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { powerBiRequest } from '@/lib/auth/msalConfig';
import { loadRevenueFromDb, refreshRevenue } from '@/lib/integrations/powerbi/revenueService';
import { toast } from 'sonner';

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return 'never';
  return d.toLocaleString();
}

export function RevenueAdmin() {
  const byBcn = useRevenueStore((s) => s.byBcn);
  const lastRefreshedAt = useRevenueStore((s) => s.lastRefreshedAt);
  const isRefreshing = useRevenueStore((s) => s.isRefreshing);
  const isHydrated = useRevenueStore((s) => s.isHydrated);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) {
      loadRevenueFromDb().catch((err) => {
        console.error('[revenue] hydrate failed:', err);
      });
    }
  }, [isHydrated]);

  async function handleRefresh() {
    setError(null);
    try {
      const token = await getAccessToken(powerBiRequest.scopes);
      if (!token) {
        throw new Error('No Power BI access token — sign in again to grant Dataset.Read.All scope.');
      }
      const { count } = await refreshRevenue(token);
      toast.success(`Revenue refreshed`, { description: `${count} customers updated from Power BI` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[revenue] refresh failed:', msg);
      setError(msg);
      toast.error('Revenue refresh failed', { description: msg.slice(0, 200) });
    }
  }

  const cachedCount = byBcn.size;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Power BI Revenue Sync</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Aggregates the latest-month ARR per customer (joined on BCN) from the Global Dashboard by CSM dataset.
          Server-side aggregation keeps the response small regardless of the 27M-row underlying fact table.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isRefreshing ? 'Refreshing…' : 'Refresh now'}
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database size={14} className="shrink-0" />
          <span>
            <span className="text-foreground font-medium tabular-nums">{cachedCount.toLocaleString()}</span>
            {' '}customer{cachedCount === 1 ? '' : 's'} cached · last refreshed {formatTimestamp(lastRefreshedAt)}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}
    </div>
  );
}
