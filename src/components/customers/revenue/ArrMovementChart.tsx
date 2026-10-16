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
import type { ArrMovementRow } from '@/store/customerRevenueDetailStore';
import { cn } from '@/lib/utils';

interface Props {
  rows: ArrMovementRow[];
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

function formatValue(value: number): string {
  const abs = Math.abs(value);
  try {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
      notation: abs >= 100_000 ? 'compact' : 'standard',
    }).format(value);
  } catch {
    // Intentional: Intl can reject exotic locales/currencies — fall back to a plain string.
    return `EUR ${value.toLocaleString('nl-BE', { maximumFractionDigits: 0 })}`;
  }
}

/** Stacked monthly ARR movement (new sale, upgrade, downgrade, cancellation) with a net line. */
export function ArrMovementChart({ rows, className }: Props) {
  const data: ChartRow[] = useMemo(() => {
    return rows.map((r) => {
      const newSale = Math.abs(r.newSaleLc);
      const upgrade = Math.abs(r.upgradeLc);
      const downgrade = -Math.abs(r.downgradeLc);
      const cancellation = -Math.abs(r.cancellationLc);
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
  }, [rows]);

  return (
    <div className={cn('-ml-2 h-[260px]', className)}>
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
            formatter={(value: number, name: string) => [formatValue(value), name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8, color: 'hsl(var(--muted-foreground))' }} iconSize={8} iconType="circle" />
          <Bar dataKey="NewSale" name="New sale" stackId="movement" maxBarSize={28} fill="hsl(var(--success))" />
          <Bar dataKey="Upgrade" name="Upgrade" stackId="movement" maxBarSize={28} fill="hsl(var(--primary))" />
          <Bar dataKey="Downgrade" name="Downgrade" stackId="movement" maxBarSize={28} fill="hsl(var(--warning))" />
          <Bar dataKey="Cancellation" name="Cancellation" stackId="movement" maxBarSize={28} fill="hsl(var(--destructive))" />
          <Line
            type="monotone"
            dataKey="Net"
            name="Net"
            stroke="hsl(var(--foreground))"
            strokeWidth={1.5}
            dot={{ r: 2.5, fill: 'hsl(var(--foreground))' }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
