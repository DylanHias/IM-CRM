'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

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
    activityByUser,
    isLoading, loadAnalytics,
  } = useAdminStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return activityByUser;
    return activityByUser.filter((u) => u.userName.toLowerCase().includes(q));
  }, [activityByUser, userSearch]);

  const filteredTimeline = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return activityTimeline.filter((p) => p.date >= cutoffStr);
  }, [activityTimeline, timeRange]);

  if (isLoading && !dataQuality) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading analytics...</p>;
  }

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

      {/* Activity Statistics divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity Statistics</span>
        <div className="h-px flex-1 bg-border/60" />
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
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
            {ACTIVITY_TYPES.map((type) => (
              <Area
                key={type}
                dataKey={type}
                type="linear"
                fill={`url(#fill-${type})`}
                stroke={`var(--color-${type})`}
                strokeWidth={2}

              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Activities by User */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activities by User</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="relative w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input
              placeholder="Search users…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-8 h-8 pr-7 text-xs bg-card shadow-sm border-border/70 rounded-lg"
            />
            {userSearch && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setUserSearch('')}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
        {filteredUsers.length > 0 ? (
          <ChartContainer
            config={{ count: { label: 'Activities', color: 'hsl(var(--primary))' } }}
            className="w-full"
            style={{ height: Math.max(120, filteredUsers.length * 36) }}
          >
            <BarChart data={filteredUsers} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="userName" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={140} />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  if (!d) return null;
                  const types = [
                    { label: 'Meeting', value: d.meeting as number, color: activityChartConfig.meeting.color },
                    { label: 'Call', value: d.call as number, color: activityChartConfig.call.color },
                    { label: 'Visit', value: d.visit as number, color: activityChartConfig.visit.color },
                    { label: 'Note', value: d.note as number, color: activityChartConfig.note.color },
                  ].filter((t) => t.value > 0);
                  return (
                    <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md text-xs min-w-[140px]">
                      <p className="font-semibold mb-1.5">{d.userName}</p>
                      <p className="text-muted-foreground mb-1.5">{d.count} total</p>
                      <div className="space-y-1">
                        {types.map((t) => (
                          <div key={t.label} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-block h-2 w-2 rounded-sm flex-shrink-0" style={{ backgroundColor: t.color }} />
                              <span className="text-muted-foreground">{t.label}</span>
                            </div>
                            <span className="font-medium">{t.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No users found</p>
        )}
      </div>

    </div>
  );
}
