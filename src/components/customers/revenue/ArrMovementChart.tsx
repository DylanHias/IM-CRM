'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import { useArrMovement } from '@/hooks/useArrMovement';
import type { Currency } from '@/lib/revenue/effectiveArr';
import { cn } from '@/lib/utils';

interface Props {
  bcn: string | null;
  monthsBack: number;
  currency: Currency;
  currencyCode?: string | null;
  className?: string;
}

interface ChartRow {
  month: string;
  monthLabel: string;
  NewSale: number;
  Upgrade: number;
  Downgrade: number;
  Cancellation: number;
  Net: number;
}

function formatMonthLabel(iso: string): string {
  const [y, m] = iso.split('-');
  if (!y || !m) return iso;
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

function formatValue(value: number, currencyCode: string | null): string {
  const abs = Math.abs(value);
  const cur = currencyCode ?? 'USD';
  try {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 0,
      notation: abs >= 100_000 ? 'compact' : 'standard',
    }).format(value);
  } catch {
    return `${cur} ${value.toLocaleString('nl-BE', { maximumFractionDigits: 0 })}`;
  }
}

export function ArrMovementChart({ bcn, monthsBack, currency, currencyCode, className }: Props) {
  const { rows, isHydrated } = useArrMovement(bcn, monthsBack);

  const data: ChartRow[] = useMemo(() => {
    return rows.map((r) => {
      const newSale = Math.abs(currency === 'USD' ? r.newSaleUsd : r.newSaleLc);
      const upgrade = Math.abs(currency === 'USD' ? r.upgradeUsd : r.upgradeLc);
      const downgrade = -Math.abs(currency === 'USD' ? r.downgradeUsd : r.downgradeLc);
      const cancellation = -Math.abs(currency === 'USD' ? r.cancellationUsd : r.cancellationLc);
      return {
        month: r.month,
        monthLabel: formatMonthLabel(r.month),
        NewSale: newSale,
        Upgrade: upgrade,
        Downgrade: downgrade,
        Cancellation: cancellation,
        Net: newSale + upgrade + downgrade + cancellation,
      };
    });
  }, [rows, currency]);

  const displayCurrency = currency === 'USD' ? 'USD' : currencyCode ?? null;

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-3',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <BarChart3 size={13} />
        ARR movement · last {monthsBack} months
      </div>

      {!bcn && (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-6 text-xs text-muted-foreground">
          <AlertCircle size={13} />
          Customer is missing a BCN — no movement data available.
        </div>
      )}

      {bcn && data.length === 0 && !isHydrated && (
        <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
          <Loader2 size={14} className="mr-2 animate-spin" />
          Loading movement data…
        </div>
      )}

      {bcn && data.length === 0 && isHydrated && (
        <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
          No movement recorded for this customer in the last {monthsBack} months.
        </div>
      )}

      {data.length > 0 && (
        <div className="h-72 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} stackOffset="sign">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) =>
                  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v as number)
                }
              />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [formatValue(value, displayCurrency), name]}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconSize={10} />
              <Bar dataKey="NewSale" stackId="movement" fill="hsl(var(--success))" />
              <Bar dataKey="Upgrade" stackId="movement" fill="hsl(var(--primary))" />
              <Bar dataKey="Downgrade" stackId="movement" fill="hsl(var(--warning))" />
              <Bar dataKey="Cancellation" stackId="movement" fill="hsl(var(--destructive))" />
              <Line
                type="monotone"
                dataKey="Net"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--foreground))' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
