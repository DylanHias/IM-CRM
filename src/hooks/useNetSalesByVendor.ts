import { useMemo } from 'react';
import { useRevenueInsightsStore } from '@/store/revenueInsightsStore';

export interface VendorMonthlySales {
  vendor: string;
  totalLc: number;
  pointsByMonth: Map<string, number>;
}

export interface NetSalesByVendorEntry {
  months: string[];
  vendors: VendorMonthlySales[];
}

interface Result {
  entry: NetSalesByVendorEntry | null;
  isHydrated: boolean;
}

export function useNetSalesByVendor(
  monthsBack: number,
  countryCodes: readonly string[],
  topN: number,
): Result {
  const rows = useRevenueInsightsStore((s) => s.vendorSalesRows);
  const isHydrated = useRevenueInsightsStore((s) => s.isHydrated);

  const entry = useMemo<NetSalesByVendorEntry | null>(() => {
    if (rows.length === 0) return null;
    const codeSet = new Set(countryCodes.map((c) => c.toUpperCase()));

    // First pass: sum each vendor's monthly LC across the requested countries.
    const totalsByVendor = new Map<string, Map<string, number>>();
    const monthSet = new Set<string>();
    for (const r of rows) {
      if (!codeSet.has(r.countryCode)) continue;
      monthSet.add(r.month);
      let perMonth = totalsByVendor.get(r.vendor);
      if (!perMonth) {
        perMonth = new Map();
        totalsByVendor.set(r.vendor, perMonth);
      }
      perMonth.set(r.month, (perMonth.get(r.month) ?? 0) + r.netSalesLc);
    }

    // Trim months to monthsBack (sorted, take tail).
    const allMonthsSorted = Array.from(monthSet).sort();
    const safeMonths = Math.max(1, Math.floor(monthsBack));
    const months = allMonthsSorted.slice(-safeMonths);
    if (months.length === 0) return null;
    const monthFilter = new Set(months);

    // Second pass: compute window totals, drop vendors with zero in-window, pick topN.
    const vendors: VendorMonthlySales[] = [];
    totalsByVendor.forEach((perMonth, vendor) => {
      const trimmedPoints = new Map<string, number>();
      let totalLc = 0;
      perMonth.forEach((v, m) => {
        if (!monthFilter.has(m)) return;
        trimmedPoints.set(m, v);
        totalLc += v;
      });
      if (totalLc <= 0) return;
      vendors.push({ vendor, totalLc, pointsByMonth: trimmedPoints });
    });
    vendors.sort((a, b) => b.totalLc - a.totalLc);
    const safeTop = Math.max(1, Math.floor(topN));
    const topVendors = vendors.slice(0, safeTop);

    return { months, vendors: topVendors };
  }, [rows, monthsBack, countryCodes, topN]);

  return { entry, isHydrated };
}
