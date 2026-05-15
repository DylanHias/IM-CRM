'use client';

import { useMemo } from 'react';
import { TrendingUp, Users, BarChart3, Radio } from 'lucide-react';
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

function formatCurrency(value: number, code: string): string {
  try {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
      notation: Math.abs(value) >= 1_000_000 ? 'compact' : 'standard',
    }).format(value);
  } catch {
    return `${code} ${value.toLocaleString('nl-BE', { maximumFractionDigits: 0 })}`;
  }
}

interface Kpi {
  label: string;
  icon: typeof TrendingUp;
  value: string;
  hint?: string;
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon size={13} />
        {kpi.label}
      </div>
      <div className="text-3xl font-semibold tabular-nums text-foreground">{kpi.value}</div>
      {kpi.hint && <div className="text-xs text-muted-foreground">{kpi.hint}</div>}
    </div>
  );
}

export function KpiCards({ currency, region, className }: Props) {
  const byBcn = useRevenueStore((s) => s.byBcn);
  const byResellerAccount = useRevenueStore((s) => s.byResellerAccount);
  const customers = useCustomerStore((s) => s.customers);

  const kpis = useMemo<Kpi[]>(() => {
    const codes = REGION_COUNTRIES[region];
    const scopedCustomers = customers.filter((c) => c.addressCountry && codes.includes(c.addressCountry));

    let totalArr = 0;
    let activeCount = 0;
    let coveredCount = 0;
    const seenRowKeys = new Set<string>();
    for (const c of scopedCustomers) {
      const row =
        (c.bcn ? byBcn.get(c.bcn) : undefined) ||
        (c.accountNumber ? byResellerAccount.get(c.accountNumber) : undefined);
      if (!row) continue;
      // Dedupe across the two index paths so a single PBI row never counts twice
      // if a customer matches by both BCN and account number.
      if (seenRowKeys.has(row.bcn)) continue;
      seenRowKeys.add(row.bcn);
      coveredCount++;
      const value = currency === 'USD' ? row.arrUsd : row.arrLc;
      if (value !== null && value > 0) {
        totalArr += value;
        activeCount++;
      }
    }
    const avgArr = activeCount > 0 ? totalArr / activeCount : 0;
    const coveragePct = scopedCustomers.length > 0 ? (coveredCount / scopedCustomers.length) * 100 : 0;

    const code = currency === 'USD' ? 'USD' : 'EUR';

    return [
      {
        label: 'Total ARR',
        icon: TrendingUp,
        value: formatCurrency(totalArr, code),
        hint: `${activeCount.toLocaleString('nl-BE')} active customers`,
      },
      {
        label: 'Active customers',
        icon: Users,
        value: activeCount.toLocaleString('nl-BE'),
        hint: `${scopedCustomers.length.toLocaleString('nl-BE')} in scope`,
      },
      {
        label: 'Average ARR',
        icon: BarChart3,
        value: activeCount > 0 ? formatCurrency(avgArr, code) : '—',
        hint: 'Per active customer',
      },
      {
        label: 'Live coverage',
        icon: Radio,
        value: `${coveragePct.toFixed(0)}%`,
        hint: `${coveredCount.toLocaleString('nl-BE')} / ${scopedCustomers.length.toLocaleString('nl-BE')} customers matched`,
      },
    ];
  }, [byBcn, byResellerAccount, customers, currency, region]);

  return (
    <div className={cn('grid grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {kpis.map((k) => (
        <KpiCard key={k.label} kpi={k} />
      ))}
    </div>
  );
}
