'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Loader2, RefreshCw, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNetSalesByVendor } from '@/hooks/useNetSalesByVendor';
import { PowerBiUnavailable } from '@/components/revenue/PowerBiUnavailable';
import { cn } from '@/lib/utils';

interface Props {
  monthsBack: number;
  countryCodes: readonly string[];
  scopeLabel: string;
  topVendors?: number;
  className?: string;
}

const VENDOR_COLORS = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#9333ea', // purple
  '#ea580c', // orange
  '#0891b2', // cyan
  '#ca8a04', // yellow
  '#db2777', // pink
];

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

export function NetSalesByVendorChart({
  monthsBack,
  countryCodes,
  scopeLabel,
  topVendors = 8,
  className,
}: Props) {
  const { entry, isLoading, error, refresh } = useNetSalesByVendor(monthsBack, countryCodes, topVendors);

  const data = useMemo(() => {
    if (!entry || entry.months.length === 0) return [];
    return entry.months.map((month) => {
      const row: Record<string, string | number> = {
        month,
        monthLabel: formatMonthLabel(month),
      };
      for (const v of entry.vendors) {
        row[v.vendor] = v.pointsByMonth.get(month) ?? 0;
      }
      return row;
    });
  }, [entry]);

  const vendorOrder = entry?.vendors ?? [];

  return (
    <div className={cn('rounded-xl border border-border/60 bg-card p-5 shadow-sm space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <BarChart3 size={13} />
          Monthly net sales (LC) by vendor · {scopeLabel} · top {topVendors} · last {monthsBack} months
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

      {error && <PowerBiUnavailable />}

      {!error && isLoading && data.length === 0 && (
        <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
          <Loader2 size={14} className="mr-2 animate-spin" />
          Loading net sales by vendor…
        </div>
      )}

      {!error && !isLoading && data.length === 0 && (
        <div className="flex items-center justify-center py-12 text-xs text-muted-foreground">
          No sales data available.
        </div>
      )}

      {data.length > 0 && (
        <div className="h-80 -ml-2">
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
                formatter={(value: number, name: string) => [formatEur(value), name]}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
              {vendorOrder.map((v, i) => (
                <Line
                  key={v.vendor}
                  type="monotone"
                  dataKey={v.vendor}
                  stroke={VENDOR_COLORS[i % VENDOR_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
