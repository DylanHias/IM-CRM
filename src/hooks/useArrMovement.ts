import { useMemo } from 'react';
import {
  useCustomerRevenueDetailStore,
  type ArrMovementRow,
} from '@/store/customerRevenueDetailStore';

interface Result {
  rows: ArrMovementRow[];
  isHydrated: boolean;
}

export function useArrMovement(
  bcn: string | null | undefined,
  monthsBack: number,
): Result {
  const movementByBcn = useCustomerRevenueDetailStore((s) => s.movementByBcn);
  const isHydrated = useCustomerRevenueDetailStore((s) => s.isHydrated);

  const rows = useMemo<ArrMovementRow[]>(() => {
    if (!bcn) return [];
    const list = movementByBcn.get(bcn);
    if (!list || list.length === 0) return [];
    const safeMonths = Math.max(1, Math.floor(monthsBack));
    // list is already sorted ascending by month in the store.
    return list.slice(-safeMonths);
  }, [bcn, monthsBack, movementByBcn]);

  return { rows, isHydrated };
}
