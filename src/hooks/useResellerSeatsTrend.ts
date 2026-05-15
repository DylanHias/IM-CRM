import { useEffect, useCallback, useMemo } from 'react';
import {
  useRevenueInsightsStore,
  trendKey,
  type ResellerSeatsTrendPoint,
} from '@/store/revenueInsightsStore';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { powerBiRequest } from '@/lib/auth/msalConfig';
import { fetchResellerSeatsTrend } from '@/lib/integrations/powerbi/revenueInsightsService';

interface Result {
  points: ResellerSeatsTrendPoint[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useResellerSeatsTrend(
  monthsBack: number,
  countryCodes: readonly string[],
): Result {
  const storeKey = useMemo(
    () => `seats::${trendKey(monthsBack, countryCodes)}`,
    [monthsBack, countryCodes],
  );
  const entry = useRevenueInsightsStore((s) => s.resellerSeatsByKey.get(storeKey));
  const isLoading = useRevenueInsightsStore((s) => s.loadingKeys.has(storeKey));
  const error = useRevenueInsightsStore((s) => s.errorByKey.get(storeKey) ?? null);

  const refresh = useCallback(async () => {
    try {
      const token = await getAccessToken(powerBiRequest.scopes);
      if (!token) return;
      await fetchResellerSeatsTrend(token, monthsBack, countryCodes, true);
    } catch {
      // captured in store
    }
  }, [monthsBack, countryCodes]);

  useEffect(() => {
    if (entry || isLoading) return;
    void (async () => {
      try {
        const token = await getAccessToken(powerBiRequest.scopes);
        if (!token) return;
        await fetchResellerSeatsTrend(token, monthsBack, countryCodes);
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
