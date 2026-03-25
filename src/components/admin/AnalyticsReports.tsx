'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import {
  AreaChart, Area,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const ACTIVITY_TYPES = ['meeting', 'call', 'visit', 'note'] as const;

const activityChartConfig = {
  meeting: { label: 'Meeting', color: 'hsl(var(--primary))' },
  call: { label: 'Call', color: 'hsl(var(--chart-2, 220 70% 50%))' },
  visit: { label: 'Visit', color: 'hsl(var(--chart-3, 150 60% 40%))' },
  note: { label: 'Note', color: 'hsl(var(--chart-4, 280 65% 60%))' },
};

type TimeRange = '7d' | '30d' | '90d';

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 3 months',
};

export function AnalyticsReports() {
  const {
    dataQuality, activityTimeline,
    activityByUser, pipelineByStage, winRate,
    isLoading, loadAnalytics,
  } = useAdminStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const filteredTimeline = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return activityTimeline.slice(-days);
  }, [activityTimeline, timeRange]);

  if (isLoading && !dataQuality) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading analytics...</p>;
  }

  const winRateData = winRate
    ? [
        { name: 'Won', value: winRate.won },
        { name: 'Lost', value: winRate.lost },
        { name: 'Open', value: winRate.open },
      ].filter((d) => d.value > 0)
    : [];

  const qualityCards = dataQuality ? [
    { label: 'Customers w/o Contacts', value: dataQuality.customersWithoutContacts, total: dataQuality.totalCustomers },
    { label: 'Customers w/o Recent Activity', value: dataQuality.customersWithoutRecentActivity, total: dataQuality.totalCustomers },
    { label: 'Stale Opportunities', value: dataQuality.staleOpportunities },
  ] : [];

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold">Analytics & Reports</h2>

      {/* Data Quality */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {qualityCards.map(({ label, value, total }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">
              {value}
              {total !== undefined && (
                <span className="text-xs font-normal text-muted-foreground"> / {total}</span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Activities by Type & Month — Stacked Area Chart */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activities Over Time</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Breakdown by type for the {TIME_RANGE_LABELS[timeRange].toLowerCase()}</p>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="h-8 w-[148px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ChartContainer config={activityChartConfig} className="aspect-auto h-[280px] w-full">
          <AreaChart data={filteredTimeline} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              {ACTIVITY_TYPES.map((type) => (
                <linearGradient key={type} id={`fill-${type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${type})`} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={`var(--color-${type})`} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} className="stroke-border" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11 }}
              interval={timeRange === '7d' ? 0 : timeRange === '30d' ? 1 : 4}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            {ACTIVITY_TYPES.map((type) => (
              <Area
                key={type}
                dataKey={type}
                type="basis"
                fill={`url(#fill-${type})`}
                stroke={`var(--color-${type})`}
                strokeWidth={2}
                stackId="a"
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline by Stage */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pipeline by Stage</p>
          <ChartContainer config={{}} className="aspect-auto h-[200px] w-full">
            <BarChart data={pipelineByStage}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="stage" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis yAxisId="count" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="revenue" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="count" dataKey="count" fill="hsl(var(--primary))" name="Count" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="revenue" dataKey="totalRevenue" fill="hsl(var(--chart-2, 220 70% 50%))" name="Revenue" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Win Rate */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Win Rate</p>
          <ChartContainer config={{}} className="aspect-auto h-[200px] w-full">
            <PieChart>
              <Pie data={winRateData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {winRateData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ChartContainer>
        </div>
      </div>

      {/* Activities by User */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activities by User</p>
        <ChartContainer config={{}} className="aspect-auto h-[200px] w-full">
          <BarChart data={activityByUser} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis dataKey="userName" type="category" tick={{ fontSize: 11 }} width={120} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
