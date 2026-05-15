import { useEffect, useCallback, useMemo } from 'react';
import {
  useRevenueInsightsStore,
  vendorSalesKey,
  type NetSalesByVendorEntry,
} from '@/store/revenueInsightsStore';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { powerBiRequest } from '@/lib/auth/msalConfig';
import { fetchNetSalesByVendor } from '@/lib/integrations/powerbi/revenueInsightsService';

interface Result {
  entry: NetSalesByVendorEntry | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useNetSalesByVendor(
  monthsBack: number,
  countryCodes: readonly string[],
  topN: number,
): Result {
  const storeKey = useMemo(
    () => `vendorSales::${vendorSalesKey(monthsBack, countryCodes, topN)}`,
    [monthsBack, countryCodes, topN],
  );
  const entry = useRevenueInsightsStore((s) => s.vendorSalesByKey.get(storeKey));
  const isLoading = useRevenueInsightsStore((s) => s.loadingKeys.has(storeKey));
  const error = useRevenueInsightsStore((s) => s.errorByKey.get(storeKey) ?? null);

  const refresh = useCallback(async () => {
    try {
      const token = await getAccessToken(powerBiRequest.scopes);
      if (!token) return;
      await fetchNetSalesByVendor(token, monthsBack, countryCodes, topN, true);
    } catch {
      // captured in store
    }
  }, [monthsBack, countryCodes, topN]);

  useEffect(() => {
    if (entry || isLoading) return;
    void (async () => {
      try {
        const token = await getAccessToken(powerBiRequest.scopes);
        if (!token) return;
        await fetchNetSalesByVendor(token, monthsBack, countryCodes, topN);
      } catch {
        // captured in store
      }
    })();
  }, [monthsBack, countryCodes, topN, entry, isLoading]);

  return {
    entry: entry ?? null,
    isLoading,
    error,
    refresh,
  };
}
