import { useMemo } from 'react';
import { useRevenueInsightsStore } from '@/store/revenueInsightsStore';

export interface ResellerSeatsTrendPoint {
  month: string;
  activeResellers: number;
  activeSeats: number;
}

interface Result {
  points: ResellerSeatsTrendPoint[];
  isHydrated: boolean;
}

export function useResellerSeatsTrend(
  monthsBack: number,
  countryCodes: readonly string[],
): Result {
  const rows = useRevenueInsightsStore((s) => s.resellerSeatsRows);
  const isHydrated = useRevenueInsightsStore((s) => s.isHydrated);

  const points = useMemo<ResellerSeatsTrendPoint[]>(() => {
    if (rows.length === 0) return [];
    const codeSet = new Set(countryCodes.map((c) => c.toUpperCase()));

    const byMonth = new Map<string, { activeResellers: number; activeSeats: number }>();
    for (const r of rows) {
      if (!codeSet.has(r.countryCode)) continue;
      const agg = byMonth.get(r.month) ?? { activeResellers: 0, activeSeats: 0 };
      agg.activeResellers += r.activeResellers;
      agg.activeSeats += r.activeSeats;
      byMonth.set(r.month, agg);
    }
    const sorted = Array.from(byMonth.entries())
      .map(([month, v]) => ({ month, ...v }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return sorted.slice(-Math.max(1, Math.floor(monthsBack)));
  }, [rows, monthsBack, countryCodes]);

  return { points, isHydrated };
}
