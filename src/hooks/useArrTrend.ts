import { useEffect, useCallback, useMemo } from 'react';
import {
  useRevenueInsightsStore,
  trendKey,
  type ArrTrendPoint,
} from '@/store/revenueInsightsStore';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { powerBiRequest } from '@/lib/auth/msalConfig';
import {
  fetchArrTrend,
  loadArrTrendFromDb,
} from '@/lib/integrations/powerbi/revenueInsightsService';

interface Result {
  points: ArrTrendPoint[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useArrTrend(monthsBack: number, countryCodes: readonly string[]): Result {
  const key = useMemo(() => trendKey(monthsBack, countryCodes), [monthsBack, countryCodes]);
  const entry = useRevenueInsightsStore((s) => s.trendByKey.get(key));
  const isLoading = useRevenueInsightsStore((s) => s.loadingKeys.has(key));
  const error = useRevenueInsightsStore((s) => s.errorByKey.get(key) ?? null);

  const refresh = useCallback(async () => {
    try {
      const token = await getAccessToken(powerBiRequest.scopes);
      if (!token) return;
      await fetchArrTrend(token, monthsBack, countryCodes, true);
    } catch {
      // captured in store
    }
  }, [monthsBack, countryCodes]);

  useEffect(() => {
    if (entry || isLoading) return;
    void (async () => {
      const cached = await loadArrTrendFromDb(monthsBack, countryCodes);
      if (cached && cached.length > 0) return;
      try {
        const token = await getAccessToken(powerBiRequest.scopes);
        if (!token) return;
        await fetchArrTrend(token, monthsBack, countryCodes);
      } catch {
        // captured in store
      }
    })();
  }, [monthsBack, countryCodes, entry, isLoading]);

  return {
    points: entry?.points ?? [],
    isLoading,
    error,
    refresh,
  };
}
