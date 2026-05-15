'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { useRevenueStore } from '@/store/revenueStore';
import { useCustomerStore } from '@/store/customerStore';
import type { Currency } from '@/lib/revenue/effectiveArr';
import { type Region, REGION_COUNTRIES } from '@/lib/revenue/region';
import { cn } from '@/lib/utils';

interface Props {
  currency: Currency;
  region: Region;
  limit?: number;
  className?: string;
}

interface Row {
  customerId: string;
  customerName: string;
  bcn: string;
  arr: number;
  currencyCode: string;
}

function formatCurrency(value: number, code: string): string {
  try {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${code} ${value.toLocaleString('nl-BE', { maximumFractionDigits: 0 })}`;
  }
}

export function TopCustomersTable({ currency, region, limit = 25, className }: Props) {
  const router = useRouter();
  const byBcn = useRevenueStore((s) => s.byBcn);
  const customers = useCustomerStore((s) => s.customers);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    const codes = REGION_COUNTRIES[region];
    const customersByBcn = new Map<string, { id: string; name: string }>();
    for (const c of customers) {
      if (!c.bcn) continue;
      if (!c.addressCountry || !codes.includes(c.addressCountry)) continue;
      customersByBcn.set(c.bcn, { id: c.id, name: c.name });
    }
    for (const r of Array.from(byBcn.values())) {
      const value = currency === 'USD' ? r.arrUsd : r.arrLc;
      if (value === null || value <= 0) continue;
      const customer = customersByBcn.get(r.bcn);
      if (!customer) continue;
      out.push({
        customerId: customer.id,
        customerName: customer.name,
        bcn: r.bcn,
        arr: value,
        currencyCode: currency === 'USD' ? 'USD' : r.currencyCode ?? 'EUR',
      });
    }
    out.sort((a, b) => b.arr - a.arr);
    return out.slice(0, limit);
  }, [byBcn, customers, currency, region, limit]);

  return (
    <div className={cn('rounded-xl border border-border/60 bg-card shadow-sm', className)}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Trophy size={13} />
          Top customers by ARR
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          Showing {rows.length} of top {limit}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          No revenue data yet — run a refresh in Admin → Revenue Sync.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr className="text-left">
                <th className="px-4 py-2.5 font-semibold text-xs text-muted-foreground w-10">#</th>
                <th className="px-4 py-2.5 font-semibold text-xs text-muted-foreground">Customer</th>
                <th className="px-4 py-2.5 font-semibold text-xs text-muted-foreground hidden md:table-cell">BCN</th>
                <th className="px-4 py-2.5 font-semibold text-xs text-muted-foreground text-right">ARR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((row, idx) => (
                <tr key={row.customerId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{idx + 1}</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => router.push(`/customers?id=${row.customerId}&tab=revenue`)}
                      className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors text-left"
                    >
                      {row.customerName}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs hidden md:table-cell">{row.bcn}</td>
                  <td className="px-4 py-2.5 font-semibold tabular-nums text-right">
                    {formatCurrency(row.arr, row.currencyCode)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
