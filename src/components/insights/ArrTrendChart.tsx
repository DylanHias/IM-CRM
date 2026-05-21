'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Loader2, LineChart as LineChartIcon } from 'lucide-react';
import { useArrTrend } from '@/hooks/useArrTrend';
import { cn } from '@/lib/utils';

interface Props {
  monthsBack: number;
  countryCodes: readonly string[];
  scopeLabel: string;
  className?: string;
}

function formatMonthLabel(iso: string): string {
  const [y, m] = iso.split('-');
  if (!y || !m) return iso;
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

function formatEur(value: number): string {
  try {
    return new Intl.NumberFormat('nl-BE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
      notation: Math.abs(value) >= 1_000_000 ? 'compact' : 'standard',
    }).format(value);
  } catch {
    return `€ ${value.toLocaleString('nl-BE')}`;
  }
}

export function ArrTrendChart({ monthsBack, countryCodes, scopeLabel, className }: Props) {
  const { points, isHydrated } = useArrTrend(monthsBack, countryCodes);

  const data = useMemo(
    () =>
      points.map((p) => ({
        month: p.month,
        monthLabel: formatMonthLabel(p.month),
        ARR: p.arrLc,
        Customers: p.customerCount,
      })),
    [points],
  );

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-3',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <LineChartIcon size={13} />
        Total ARR · {scopeLabel} · last {monthsBack} months
      </div>

      {data.length === 0 && !isHydrated && (
        <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
          <Loader2 size={14} className="mr-2 animate-spin" />
          Loading ARR trend…
        </div>
      )}

      {data.length === 0 && isHydrated && (
        <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
          No trend data available — run a refresh in Admin → Revenue Sync.
        </div>
      )}

      {data.length > 0 && (
        <div className="h-72 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                  new Intl.NumberFormat('nl-BE', { notation: 'compact', maximumFractionDigits: 1 }).format(v as number)
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 6,
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) =>
                  name === 'ARR' ? [formatEur(value), 'ARR'] : [value.toLocaleString('nl-BE'), 'Customers']
                }
              />
              <Line
                type="monotone"
                dataKey="ARR"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
