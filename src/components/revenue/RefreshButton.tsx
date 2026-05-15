'use client';

import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRevenueStore } from '@/store/revenueStore';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { powerBiRequest } from '@/lib/auth/msalConfig';
import { refreshRevenue } from '@/lib/integrations/powerbi/revenueService';
import { cn } from '@/lib/utils';

interface Props {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default';
  className?: string;
  label?: string;
}

export function RefreshButton({
  variant = 'outline',
  size = 'sm',
  className,
  label = 'Refresh',
}: Props) {
  const isRefreshing = useRevenueStore((s) => s.isRefreshing);

  async function handleRefresh() {
    try {
      const token = await getAccessToken(powerBiRequest.scopes);
      if (!token) {
        toast.error('Sign in again to refresh revenue');
        return;
      }
      const { count } = await refreshRevenue(token);
      toast.success('Revenue refreshed', {
        description: `${count.toLocaleString()} customers updated from Power BI`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[revenue] refresh failed:', msg);
      toast.error('Revenue refresh failed', { description: msg.slice(0, 200) });
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={cn('h-9 gap-1.5', className)}
    >
      {isRefreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
      {isRefreshing ? 'Refreshing…' : label}
    </Button>
  );
}
