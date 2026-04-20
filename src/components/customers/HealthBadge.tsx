'use client';

import { Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  healthTier,
  healthTierLabel,
  healthTierBadgeVariant,
  HEALTH_WEIGHTS,
  type HealthTier,
} from '@/lib/customers/healthScore';

interface HealthBadgeProps {
  score: number | null | undefined;
  recency?: number;
  pipeline?: number;
  frequency?: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function HealthBadge({
  score,
  recency,
  pipeline,
  frequency,
  size = 'sm',
  showLabel = false,
  className,
}: HealthBadgeProps) {
  const tier: HealthTier = healthTier(score);
  const variant = healthTierBadgeVariant(tier);
  const label = healthTierLabel(tier);
  const display = score === null || score === undefined ? '–' : String(score);

  const hasBreakdown = recency !== undefined && pipeline !== undefined && frequency !== undefined;

  const badge = (
    <Badge
      variant={variant}
      className={cn(
        'gap-1 font-semibold',
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5',
        className,
      )}
    >
      <Heart size={size === 'sm' ? 9 : 11} className="flex-shrink-0" />
      <span>{display}</span>
      {showLabel && <span className="font-normal opacity-80">· {label}</span>}
    </Badge>
  );

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help">{badge}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="font-semibold mb-1">Health {display} · {label}</div>
          {hasBreakdown ? (
            <div className="space-y-0.5 text-muted-foreground">
              <div>Recency <span className="text-foreground">{recency}</span> × {HEALTH_WEIGHTS.recency}</div>
              <div>Pipeline <span className="text-foreground">{pipeline}</span> × {HEALTH_WEIGHTS.pipeline}</div>
              <div>Frequency <span className="text-foreground">{frequency}</span> × {HEALTH_WEIGHTS.frequency}</div>
            </div>
          ) : (
            <div className="text-muted-foreground max-w-[220px]">
              Recency of last contact, open opportunities, and activity frequency in the last 90 days.
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
