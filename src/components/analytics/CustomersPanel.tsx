'use client';

import { useEffect, useState } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { MetricCard } from '@/components/analytics/MetricCard';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, CloudLightning, AlertTriangle } from 'lucide-react';
import type { ArrByDimensionPoint } from '@/types/analytics';

type ArrDim = 'industry' | 'segment' | 'country';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 220 70% 50%))',
  'hsl(var(--chart-3, 150 60% 40%))',
  'hsl(var(--chart-4, 280 65% 60%))',
  'hsl(var(--chart-5, 340 75% 55%))',
  'hsl(var(--destructive))',
  'hsl(var(--warning, 45 93% 47%))',
  'hsl(var(--muted-foreground))',
];

function fmtEur(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}k`;
  return `€${n.toLocaleString('nl-BE')}`;
}

const arrConfig = {
  totalArr: { label: 'ARR', color: 'hsl(var(--primary))' },
};
const distConfig = {
  count: { label: 'Customers', color: 'hsl(var(--primary))' },
};

const BUCKET_ORDER = ['No ARR', '< €10k', '€10k–50k', '€50k–200k', '€200k+'];

function ArrByDimChart({ data }: { data: ArrByDimensionPoint[] }) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No data.</p>;
  }
  return (
    <ChartContainer config={arrConfig} className="w-full" style={{ height: Math.max(120, data.length * 40) }}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
        <XAxis type="number" hide />
        <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={110} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => (
                <div className="text-xs space-y-0.5">
                  <p className="font-medium">{fmtEur(Number(value))}</p>
                  <p className="text-muted-foreground">{item.payload.customerCount} customer{item.payload.customerCount !== 1 ? 's' : ''}</p>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="totalArr" fill="var(--color-totalArr)" radius={[0, 4, 4, 0]} barSize={24} />
      </BarChart>
    </ChartContainer>
  );
}

export function CustomersPanel() {
  const [arrDim, setArrDim] = useState<ArrDim>('industry');
  const { customers, isLoadingCustomers, loadCustomers } = useAnalyticsStore();

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  if (isLoadingCustomers && !customers) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  const c = customers;

  const dimData: ArrByDimensionPoint[] =
    arrDim === 'industry' ? (c?.arrByIndustry ?? [])
    : arrDim === 'segment' ? (c?.arrBySegment ?? [])
    : (c?.arrByCountry ?? []);

  const arrDist = c
    ? BUCKET_ORDER.map((bucket) => {
        const found = c.arrDistribution.find((d) => d.bucket === bucket);
        return { bucket, count: found?.count ?? 0 };
      }).filter((d) => d.count > 0)
    : [];

  const cloudPieData = c
    ? c.cloudBySegment.map((s, i) => [
        { name: `${s.segment} — Cloud`, value: s.cloud, color: COLORS[i % COLORS.length] },
        { name: `${s.segment} — Non-cloud`, value: s.total - s.cloud, color: COLORS[i % COLORS.length] + '55' },
      ]).flat().filter((d) => d.value > 0)
    : [];

  const totalCloudPct = c && c.stale.total > 0
    ? Math.round((c.cloudBySegment.reduce((s, x) => s + x.cloud, 0) / c.cloudBySegment.reduce((s, x) => s + x.total, 0)) * 100)
    : null;

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold">Customer Health</h2>

      {/* Stale customers */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">No Recent Activity</span>
        <div className="h-px flex-1 bg-border/60" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          label="30+ Days Inactive"
          value={c ? c.stale.count30 : '—'}
          icon={AlertTriangle}
          sub={c ? `of ${c.stale.total} active customers` : undefined}
        />
        <MetricCard
          label="60+ Days Inactive"
          value={c ? c.stale.count60 : '—'}
          icon={AlertTriangle}
        />
        <MetricCard
          label="90+ Days Inactive"
          value={c ? c.stale.count90 : '—'}
          icon={AlertTriangle}
        />
      </div>

      {/* Contact coverage */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Coverage</span>
        <div className="h-px flex-1 bg-border/60" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          label="With Contacts"
          value={c ? c.contactCoverage.withContacts : '—'}
          icon={Users}
        />
        <MetricCard
          label="Without Contacts"
          value={c ? c.contactCoverage.withoutContacts : '—'}
          icon={Users}
        />
        <MetricCard
          label="Avg Contacts / Customer"
          value={c ? c.contactCoverage.avgContactsPerCustomer : '—'}
        />
      </div>

      {/* Cloud adoption */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cloud Adoption</span>
        <div className="h-px flex-1 bg-border/60" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MetricCard
          label="Overall Cloud Rate"
          value={totalCloudPct !== null ? `${totalCloudPct}%` : '—'}
          icon={CloudLightning}
          sub={c ? `${c.cloudBySegment.reduce((s, x) => s + x.cloud, 0)} cloud customers` : undefined}
        />

        {c && c.cloudBySegment.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">By Segment</p>
            <div className="space-y-2">
              {c.cloudBySegment.map((s, i) => {
                const pct = s.total > 0 ? Math.round((s.cloud / s.total) * 100) : 0;
                return (
                  <div key={s.segment}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground/80">{s.segment}</span>
                      <span className="text-muted-foreground">{s.cloud}/{s.total} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ARR distribution */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ARR Distribution</span>
        <div className="h-px flex-1 bg-border/60" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ARR histogram */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Customers by ARR Bucket</p>
          <p className="text-xs text-muted-foreground mb-3">Distribution across ARR ranges</p>
          {arrDist.length > 0 ? (
            <ChartContainer config={distConfig} className="aspect-auto h-[180px] w-full">
              <BarChart data={arrDist} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} className="stroke-border" />
                <XAxis dataKey="bucket" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} interval={0} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No ARR data.</p>
          )}
        </div>

        {/* ARR by dimension */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ARR by Dimension</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total ARR per group</p>
            </div>
            <Select value={arrDim} onValueChange={(v) => setArrDim(v as ArrDim)}>
              <SelectTrigger className="h-8 w-[120px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="industry">Industry</SelectItem>
                <SelectItem value="segment">Segment</SelectItem>
                <SelectItem value="country">Country</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ArrByDimChart data={dimData.slice(0, 8)} />
        </div>
      </div>

      {/* Top customers by ARR */}
      {c && c.topByArr.length > 0 && (
        <>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top 10 by ARR</span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Industry</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Country</th>
                  <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">ARR</th>
                </tr>
              </thead>
              <tbody>
                {c.topByArr.map((cust, i) => (
                  <tr key={cust.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium">{cust.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{cust.industry ?? '—'}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{cust.country ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{fmtEur(cust.arr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
