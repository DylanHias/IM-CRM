import { useMemo } from 'react';
import { useRevenueInsightsStore } from '@/store/revenueInsightsStore';

export interface ArrTrendPoint {
  month: string;
  arrLc: number;
  customerCount: number;
}

interface Result {
  points: ArrTrendPoint[];
  isHydrated: boolean;
}

export function useArrTrend(monthsBack: number, countryCodes: readonly string[]): Result {
  const rows = useRevenueInsightsStore((s) => s.arrTrendRows);
  const isHydrated = useRevenueInsightsStore((s) => s.isHydrated);

  const points = useMemo<ArrTrendPoint[]>(() => {
    if (rows.length === 0) return [];
    const codeSet = new Set(countryCodes.map((c) => c.toUpperCase()));

    // Sum across the requested countries per month, count distinct resellers
    // via DISTINCTCOUNT-equivalent: customer_count rows per country are already
    // distinct within that country, and a reseller has exactly one country_code,
    // so summing them across the region also yields a correct distinct count.
    const byMonth = new Map<string, { arrLc: number; customerCount: number }>();
    for (const r of rows) {
      if (!codeSet.has(r.countryCode)) continue;
      const agg = byMonth.get(r.month) ?? { arrLc: 0, customerCount: 0 };
      agg.arrLc += r.arrLc;
      agg.customerCount += r.customerCount;
      byMonth.set(r.month, agg);
    }
    const sorted = Array.from(byMonth.entries())
      .map(([month, v]) => ({ month, arrLc: v.arrLc, customerCount: v.customerCount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return sorted.slice(-Math.max(1, Math.floor(monthsBack)));
  }, [rows, monthsBack, countryCodes]);

  return { points, isHydrated };
}
