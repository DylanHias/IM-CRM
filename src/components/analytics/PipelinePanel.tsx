'use client';

import { useEffect, useState } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { MetricCard } from '@/components/analytics/MetricCard';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp, Layers, Users } from 'lucide-react';
import type { StageFunnelPoint } from '@/types/analytics';

const STAGE_ORDER: Record<string, number> = {
  Prospecting: 1,
  Validated: 2,
  Qualified: 3,
  'Verbal Received': 4,
  'Contract Received': 5,
  'Billing Rejection': 6,
  'Pending Vendor Confirmation': 7,
  Purchased: 8,
};

function sortFunnel(stages: StageFunnelPoint[]): StageFunnelPoint[] {
  return [...stages].sort((a, b) => (STAGE_ORDER[a.stage] ?? 99) - (STAGE_ORDER[b.stage] ?? 99));
}

function fmtEur(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}k`;
  return `€${n.toLocaleString('nl-BE')}`;
}

const forecastConfig = {
  total: { label: 'Total', color: 'hsl(var(--primary))' },
  weighted: { label: 'Weighted', color: 'hsl(var(--chart-3, 150 60% 40%))' },
};

const funnelConfig = {
  count: { label: 'Deals', color: 'hsl(var(--primary))' },
};

const winRateChartConfig = {
  won: { label: 'Won', color: 'hsl(142 71% 45%)' },
  lost: { label: 'Lost', color: 'hsl(var(--destructive))' },
  open: { label: 'Open', color: 'hsl(var(--primary))' },
};

const sellTypeConfig = {
  avgRevenue: { label: 'Avg Revenue', color: 'hsl(var(--primary))' },
};

const vendorConfig = {
  avgRevenue: { label: 'Avg Revenue', color: 'hsl(var(--chart-3, 150 60% 40%))' },
};

type ExpiryWindow = '7d' | '30d';

export function PipelinePanel() {
  const [expiryWindow, setExpiryWindow] = useState<ExpiryWindow>('30d');
  const { pipeline, isLoadingPipeline, loadPipeline } = useAnalyticsStore();

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  if (isLoadingPipeline && !pipeline) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  const p = pipeline;
  const funnel = p ? sortFunnel(p.stageFunnel) : [];
  const expiringFiltered = p ? p.expiring.filter((o) => {
    if (expiryWindow === '7d') {
      const diff = (new Date(o.expirationDate).getTime() - Date.now()) / 86400000;
      return diff <= 7;
    }
    return true;
  }) : [];

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold">Pipeline & Forecast</h2>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Open Deals"
          value={p ? p.kpis.openCount : '—'}
          icon={Target}
        />
        <MetricCard
          label="Total Pipeline"
          value={p ? fmtEur(p.kpis.openValue) : '—'}
          icon={Layers}
        />
        <MetricCard
          label="Weighted Forecast"
          value={p ? fmtEur(p.kpis.weightedForecast) : '—'}
          icon={TrendingUp}
          sub="probability-adjusted"
        />
        <MetricCard
          label="Multi-Vendor Rate"
          value={p ? `${p.kpis.multiVendorRate.toFixed(0)}%` : '—'}
          icon={Users}
          sub="of open deals"
        />
      </div>

      {/* Stage funnel */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Stage Funnel</p>
        <p className="text-xs text-muted-foreground mb-4">Open deals per stage · hover for revenue</p>
        {funnel.length > 0 ? (
          <ChartContainer config={funnelConfig} className="aspect-auto h-[220px] w-full">
            <BarChart data={funnel} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} className="stroke-border" />
              <XAxis
                dataKey="stage"
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                interval={0}
                tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                  const words = payload.value.split(' ');
                  const lines: string[] = [];
                  let cur = '';
                  for (const w of words) {
                    if (cur && (cur + ' ' + w).length > 12) { lines.push(cur); cur = w; }
                    else cur = cur ? cur + ' ' + w : w;
                  }
                  if (cur) lines.push(cur);
                  return (
                    <text x={x} y={y} textAnchor="middle" fontSize={10} fill="currentColor">
                      {lines.map((line, i) => (
                        <tspan key={i} x={x} dy={i === 0 ? 0 : 12}>{line}</tspan>
                      ))}
                    </text>
                  );
                }}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, _name, item) => (
                      <div className="space-y-0.5 text-xs">
                        <p className="font-medium">{value} deals</p>
                        <p className="text-muted-foreground">Revenue: {fmtEur(Number(item.payload.totalRevenue))}</p>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No open opportunities.</p>
        )}
      </div>

      {/* Win Rate */}
      {p && (p.winRate.won > 0 || p.winRate.lost > 0 || p.winRate.open > 0) && (() => {
        const winRateData = [
          { name: 'Won', value: p.winRate.won },
          { name: 'Lost', value: p.winRate.lost },
          { name: 'Open', value: p.winRate.open },
        ].filter((d) => d.value > 0);
        return (
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Win Rate</p>
            <p className="text-xs text-muted-foreground mb-4">Won · Lost · Open — all time</p>
            <ChartContainer config={winRateChartConfig} className="aspect-auto h-[200px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie data={winRateData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ value }) => value} labelLine>
                  {winRateData.map((entry) => (
                    <Cell key={entry.name} fill={winRateChartConfig[entry.name.toLowerCase() as keyof typeof winRateChartConfig]?.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex items-center justify-center gap-4 mt-2">
              {Object.entries(winRateChartConfig).map(([key, { label, color }]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Forecast over time */}
      {p && p.forecast.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Forecast by Month</p>
          <p className="text-xs text-muted-foreground mb-4">Weighted vs total revenue from open deals expiring per month</p>
          <ChartContainer config={forecastConfig} className="aspect-auto h-[200px] w-full">
            <AreaChart data={p.forecast} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="fill-weighted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-weighted)" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="var(--color-weighted)" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="fill-total" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} className="stroke-border" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => fmtEur(v)} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => fmtEur(Number(value))}
                    indicator="dot"
                  />
                }
              />
              <Area dataKey="total" type="monotone" fill="url(#fill-total)" stroke="var(--color-total)" strokeWidth={2} />
              <Area dataKey="weighted" type="monotone" fill="url(#fill-weighted)" stroke="var(--color-weighted)" strokeWidth={2} />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </div>
      )}

      {/* Expiring deals */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expiring Soon</p>
            <p className="text-xs text-muted-foreground mt-0.5">{expiringFiltered.length} deal{expiringFiltered.length !== 1 ? 's' : ''}</p>
          </div>
          <Select value={expiryWindow} onValueChange={(v) => setExpiryWindow(v as ExpiryWindow)}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Next 7 days</SelectItem>
              <SelectItem value="30d">Next 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {expiringFiltered.length > 0 ? (
          <div className="space-y-2">
            {expiringFiltered.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{o.subject || 'Untitled'}</p>
                  <p className="text-xs text-muted-foreground">{o.customerName} · {o.stage}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  {o.estimatedRevenue != null && (
                    <p className="text-sm font-semibold">{fmtEur(o.estimatedRevenue)}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{new Date(o.expirationDate).toLocaleDateString('nl-BE')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No deals expiring in this window.</p>
        )}
      </div>

      {/* Deal breakdown grid */}
      {p && (p.bySellType.length > 0 || p.byVendor.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {p.bySellType.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">By Sell Type</p>
              <p className="text-xs text-muted-foreground mb-3">Average deal size</p>
              <ChartContainer config={sellTypeConfig} className="w-full" style={{ height: Math.max(120, p.bySellType.length * 40) }}>
                <BarChart data={p.bySellType} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                  <XAxis type="number" hide tickFormatter={(v) => fmtEur(v)} />
                  <YAxis dataKey="sellType" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={80} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => fmtEur(Number(value))}
                      />
                    }
                  />
                  <Bar dataKey="avgRevenue" fill="var(--color-avgRevenue)" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ChartContainer>
            </div>
          )}

          {p.byVendor.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">By Vendor</p>
              <p className="text-xs text-muted-foreground mb-3">Average deal size · top 10</p>
              <ChartContainer config={vendorConfig} className="w-full" style={{ height: Math.max(120, p.byVendor.length * 40) }}>
                <BarChart data={p.byVendor} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="vendor" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={100} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => fmtEur(Number(value))}
                      />
                    }
                  />
                  <Bar dataKey="avgRevenue" fill="var(--color-avgRevenue)" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ChartContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
