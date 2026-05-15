import { useEffect, useCallback } from 'react';
import {
  useRevenueInsightsStore,
  type ArrTrendPoint,
} from '@/store/revenueInsightsStore';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { powerBiRequest } from '@/lib/auth/msalConfig';
import { fetchArrTrend } from '@/lib/integrations/powerbi/revenueInsightsService';

interface Result {
  points: ArrTrendPoint[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useArrTrend(monthsBack: number): Result {
  const entry = useRevenueInsightsStore((s) => s.trendByMonths.get(monthsBack));
  const isLoading = useRevenueInsightsStore((s) => s.loadingMonths.has(monthsBack));
  const error = useRevenueInsightsStore((s) => s.errorByMonths.get(monthsBack) ?? null);

  const refresh = useCallback(async () => {
    try {
      const token = await getAccessToken(powerBiRequest.scopes);
      if (!token) return;
      await fetchArrTrend(token, monthsBack, true);
    } catch {
      // captured in store
    }
  }, [monthsBack]);

  useEffect(() => {
    if (entry || isLoading) return;
    void (async () => {
      try {
        const token = await getAccessToken(powerBiRequest.scopes);
        if (!token) return;
        await fetchArrTrend(token, monthsBack);
      } catch {
        // captured in store
      }
    })();
  }, [monthsBack, entry, isLoading]);

  return {
    points: entry?.points ?? [],
    isLoading,
    error,
    refresh,
  };
}
