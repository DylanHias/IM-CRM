import { useEffect, useCallback } from 'react';
import {
  useCustomerRevenueDetailStore,
  movementKey,
  type ArrMovementRow,
} from '@/store/customerRevenueDetailStore';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { powerBiRequest } from '@/lib/auth/msalConfig';
import { fetchArrMovement } from '@/lib/integrations/powerbi/customerRevenueDetailService';

interface Result {
  rows: ArrMovementRow[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useArrMovement(
  bcn: string | null | undefined,
  monthsBack: number,
): Result {
  const key = bcn ? movementKey(bcn, monthsBack) : null;
  const entry = useCustomerRevenueDetailStore((s) => (key ? s.movementByKey.get(key) : undefined));
  const isLoading = useCustomerRevenueDetailStore((s) => (key ? s.loadingKeys.has(key) : false));
  const error = useCustomerRevenueDetailStore((s) => (key ? s.errorByKey.get(key) ?? null : null));

  const refresh = useCallback(async () => {
    if (!bcn) return;
    try {
      const token = await getAccessToken(powerBiRequest.scopes);
      if (!token) {
        console.warn('[revenue-detail] no Power BI token — refresh skipped');
        return;
      }
      await fetchArrMovement(token, bcn, monthsBack, true);
    } catch {
      // Error already captured in the store by the service.
    }
  }, [bcn, monthsBack]);

  useEffect(() => {
    if (!bcn) return;
    if (entry) return;
    if (isLoading) return;
    void (async () => {
      try {
        const token = await getAccessToken(powerBiRequest.scopes);
        if (!token) return;
        await fetchArrMovement(token, bcn, monthsBack);
      } catch {
        // captured in store
      }
    })();
  }, [bcn, monthsBack, entry, isLoading]);

  return {
    rows: entry?.rows ?? [],
    isLoading,
    error,
    refresh,
  };
}
