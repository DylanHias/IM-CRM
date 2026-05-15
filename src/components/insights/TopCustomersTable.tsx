'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { TablePagination } from '@/components/ui/TablePagination';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import { useRevenueStore } from '@/store/revenueStore';
import { useCustomerStore } from '@/store/customerStore';
import type { Currency } from '@/lib/revenue/effectiveArr';
import { type Region, REGION_COUNTRIES } from '@/lib/revenue/region';
import { cn } from '@/lib/utils';

interface Props {
  currency: Currency;
  region: Region;
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

export function TopCustomersTable({ currency, region, className }: Props) {
  const router = useRouter();
  const byBcn = useRevenueStore((s) => s.byBcn);
  const byResellerAccount = useRevenueStore((s) => s.byResellerAccount);
  const customers = useCustomerStore((s) => s.customers);

  const { pageSize, setPageSize, pageSizeOptions } = usePaginationPreference('topCustomersByArr');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [region, currency]);

  const allRows: Row[] = useMemo(() => {
    const codeSet = new Set<string>(REGION_COUNTRIES[region]);
    const out: Row[] = [];
    const seen = new Set<string>();
    for (const c of customers) {
      if (!c.addressCountry || !codeSet.has(c.addressCountry)) continue;
      const r =
        (c.bcn ? byBcn.get(c.bcn) : undefined) ||
        (c.accountNumber ? byResellerAccount.get(c.accountNumber) : undefined);
      if (!r) continue;
      if (seen.has(r.bcn)) continue;
      seen.add(r.bcn);
      const value = currency === 'USD' ? r.arrUsd : r.arrLc;
      if (value === null || value <= 0) continue;
      out.push({
        customerId: c.id,
        customerName: c.name,
        bcn: r.bcn,
        arr: value,
        currencyCode: currency === 'USD' ? 'USD' : r.currencyCode ?? 'EUR',
      });
    }
    out.sort((a, b) => b.arr - a.arr);
    return out;
  }, [byBcn, byResellerAccount, customers, currency, region]);

  const total = allRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(
    () => allRows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [allRows, safePage, pageSize],
  );

  const goCustomer = useCallback(
    (id: string) => router.push(`/customers?id=${id}&tab=revenue`),
    [router],
  );

  const firstRank = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastRank = (safePage - 1) * pageSize + pageRows.length;

  return (
    <div className={cn('rounded-xl border border-border/60 bg-card shadow-sm', className)}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Trophy size={13} />
          Top customers by ARR
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {total === 0 ? '0 results' : `${firstRank}–${lastRank} of ${total.toLocaleString('nl-BE')}`}
        </span>
      </div>

      {total === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          No revenue data yet — run a refresh in Admin → Revenue Sync.
        </div>
      ) : (
        <>
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
                {pageRows.map((row, idx) => (
                  <tr key={row.customerId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                      {(safePage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => goCustomer(row.customerId)}
                        className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors text-left"
                      >
                        {row.customerName}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs hidden md:table-cell">
                      {row.bcn}
                    </td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums text-right">
                      {formatCurrency(row.arr, row.currencyCode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            className="px-5 py-3 border-t border-border/60"
            totalItems={total}
            page={safePage}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}
    </div>
  );
}
