'use client';

import { useState } from 'react';
import { AlertCircle, BarChart3, Loader2 } from 'lucide-react';
import { LastRefreshedBadge } from '@/components/revenue/LastRefreshedBadge';
import { RefreshButton } from '@/components/revenue/RefreshButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MetricStrip, Metric } from '@/components/ui/metric-strip';
import { Panel, PanelHeader, PanelBody } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/empty-state';
import { ArrMovementChart } from './ArrMovementChart';
import { useCustomerRevenue } from '@/hooks/useCustomerRevenue';
import { useArrMovement } from '@/hooks/useArrMovement';
import { getEffectiveArr } from '@/lib/revenue/effectiveArr';
import type { Customer } from '@/types/entities';

interface Props {
  customer: Customer;
}

const MONTHS_OPTIONS = [
  { value: '3', label: 'Last 3 months' },
  { value: '6', label: 'Last 6 months' },
  { value: '12', label: 'Last 12 months' },
  { value: '24', label: 'Last 24 months' },
] as const;

function formatArr(value: number | null, currency: string | null): string {
  if (value === null) return '—';
  const cur = currency ?? 'EUR';
  try {
    return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(value);
  } catch {
    // Intentional: Intl rejects unknown currency codes — fall back to a plain string.
    return `${cur} ${value.toLocaleString('nl-BE', { maximumFractionDigits: 0 })}`;
  }
}

function formatMonth(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
}

export function RevenueTabContent({ customer }: Props) {
  const [monthsBack, setMonthsBack] = useState<number>(12);
  const revenue = useCustomerRevenue(customer.bcn, customer.accountNumber);
  const effective = getEffectiveArr(customer, revenue, 'LC');
  const { rows, isHydrated } = useArrMovement(customer.bcn, monthsBack);

  const isLive = effective.source === 'powerbi';
  const asOf = formatMonth(effective.asOfMonth);
  const activeEndCustomers = revenue?.activeEndCustomers ?? null;

  const arrSub =
    effective.source === 'none'
      ? 'No revenue data yet'
      : isLive
        ? asOf ? `as of ${asOf}` : 'from Power BI'
        : 'from the last sync';

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(monthsBack)} onValueChange={(v) => setMonthsBack(Number(v))}>
          <SelectTrigger aria-label="Period" className="h-[26px] w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="flex-1" />
        <LastRefreshedBadge className="h-[22px] rounded-full border border-border bg-sunken px-2 text-[11px] font-medium text-foreground-2" />
        <RefreshButton />
      </div>

      <MetricStrip>
        <Metric label="Current ARR" value={formatArr(effective.value, effective.currency)} sub={arrSub} />
        {activeEndCustomers !== null && (
          <Metric label="Active end customers" value={activeEndCustomers.toLocaleString('nl-BE')} sub="this month" />
        )}
        {effective.source !== 'none' && (
          <Metric label="Source" value={isLive ? 'Live' : 'Synced'} sub={isLive ? 'Power BI' : 'Dynamics 365'} />
        )}
      </MetricStrip>

      <Panel>
        <PanelHeader title="ARR movement" sub={`last ${monthsBack} months`} />
        <PanelBody>
          {!customer.bcn ? (
            <EmptyState icon={AlertCircle} title="No movement data" description="This customer has no BCN in Dynamics 365." />
          ) : rows.length > 0 ? (
            <ArrMovementChart rows={rows} />
          ) : !isHydrated ? (
            <EmptyState icon={Loader2} title="Loading movement data…" className="[&_svg]:animate-spin" />
          ) : (
            <EmptyState
              icon={BarChart3}
              title="No movement data"
              description={`Nothing recorded in the last ${monthsBack} months.`}
            />
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}
