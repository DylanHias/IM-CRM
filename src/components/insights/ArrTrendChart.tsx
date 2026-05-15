'use client';

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Loader2, AlertCircle, RefreshCw, LineChart as LineChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

function formatUsd(value: number): string {
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
      notation: Math.abs(value) >= 1_000_000 ? 'compact' : 'standard',
    }).format(value);
  } catch {
    return `$${value.toLocaleString('en')}`;
  }
}

export function ArrTrendChart({ monthsBack, countryCodes, scopeLabel, className }: Props) {
  const { points, isLoading, error, refresh } = useArrTrend(monthsBack, countryCodes);

  const data = useMemo(
    () =>
      points.map((p) => ({
        month: p.month,
        monthLabel: formatMonthLabel(p.month),
        ARR: p.arrUsd,
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <LineChartIcon size={13} />
          Total ARR · {scopeLabel} · last {monthsBack} months (USD)
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void refresh()}
          disabled={isLoading}
          className="h-7 px-2 text-xs"
        >
          {isLoading ? <Loader2 size={11} className="mr-1 animate-spin" /> : <RefreshCw size={11} className="mr-1" />}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {!error && isLoading && data.length === 0 && (
        <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
          <Loader2 size={14} className="mr-2 animate-spin" />
          Loading ARR trend…
        </div>
      )}

      {!error && !isLoading && data.length === 0 && (
        <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
          No trend data available.
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
                  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v as number)
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
                  name === 'ARR' ? [formatUsd(value), 'ARR (USD)'] : [value.toLocaleString('nl-BE'), 'Customers']
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
