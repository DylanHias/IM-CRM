'use client';

import { Clock } from 'lucide-react';
import { useRevenueStore } from '@/store/revenueStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return 'unknown';
  const seconds = Math.floor((Date.now() - t) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function LastRefreshedBadge({ className }: { className?: string }) {
  const lastRefreshedAt = useRevenueStore((s) => s.lastRefreshedAt);

  const label = lastRefreshedAt
    ? `Updated ${relativeTime(lastRefreshedAt)}`
    : 'Never refreshed';

  const fullTimestamp = lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleString() : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}>
            <Clock size={11} className="shrink-0" />
            {label}
          </span>
        </TooltipTrigger>
        {fullTimestamp && (
          <TooltipContent>
            <span className="text-xs">{fullTimestamp}</span>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
