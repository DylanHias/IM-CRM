'use client';

import { useEffect, useState } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { useAuthStore } from '@/store/authStore';
import { useD365UserId } from '@/hooks/useD365UserId';
import { PeriodPicker, periodToRange } from '@/components/analytics/PeriodPicker';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import type { PeriodKey } from '@/types/analytics';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DIRECTION_COLORS: Record<string, string> = {
  Outgoing: 'hsl(var(--primary))',
  Incoming: 'hsl(var(--chart-3, 150 60% 40%))',
  Unknown: 'hsl(var(--muted-foreground))',
};

const typeMixConfig = {
  mine: { label: 'Mine', color: 'hsl(var(--primary))' },
  team: { label: 'Team', color: 'hsl(var(--chart-4, 280 65% 60%))' },
};

const heatmapConfig = {
  count: { label: 'Activities', color: 'hsl(var(--primary))' },
};

interface Props {
  refreshKey?: number;
}

export function ActivityPanel({ refreshKey }: Props) {
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const { account } = useAuthStore();
  const d365UserId = useD365UserId();

  const userIds = Array.from(new Set([d365UserId, account?.localAccountId].filter(Boolean) as string[]));

  const { activity, isLoadingActivity, loadActivity } = useAnalyticsStore();

  useEffect(() => {
    if (userIds.length === 0) return;
    const range = periodToRange(period);
    loadActivity(userIds, range);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d365UserId, account?.localAccountId, period, loadActivity, refreshKey]);

  if (isLoadingActivity && !activity) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (userIds.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Unable to identify user. Sync with D365 first.</p>;
  }

  const a = activity;

  const directionData = a
    ? [
        { name: 'Outgoing', value: a.callDirection.outgoing },
        { name: 'Incoming', value: a.callDirection.incoming },
        { name: 'Unknown', value: a.callDirection.unknown },
      ].filter((d) => d.value > 0)
    : [];

  const heatmapData = a
    ? a.heatmap.map((d) => ({ day: DAY_LABELS[d.dayOfWeek], count: d.count }))
    : [];

  const totalCalls = a ? (a.callDirection.incoming + a.callDirection.outgoing + a.callDirection.unknown) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Activity Patterns</h2>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      {/* Activity type mix — mine vs team */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Activity Type Mix</p>
        <p className="text-xs text-muted-foreground mb-4">My activities vs the rest of the team</p>
        {a && a.typeMix.some((t) => t.mine + t.team > 0) ? (
          <ChartContainer config={typeMixConfig} className="aspect-auto h-[200px] w-full">
            <BarChart
              data={a.typeMix.map((t) => ({ ...t, type: t.type.charAt(0).toUpperCase() + t.type.slice(1) }))}
              margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
            >
              <CartesianGrid vertical={false} className="stroke-border" />
              <XAxis dataKey="type" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="mine" fill="var(--color-mine)" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="team" fill="var(--color-team)" radius={[4, 4, 0, 0]} barSize={20} />
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No activities in this period.</p>
        )}
      </div>

      {/* Call direction + heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Call direction */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Call Direction</p>
          <p className="text-xs text-muted-foreground mb-3">
            {totalCalls > 0 ? `${totalCalls} call${totalCalls !== 1 ? 's' : ''} total` : 'No calls in this period'}
          </p>
          {directionData.length > 0 ? (
            <>
              <ChartContainer
                config={{
                  Outgoing: { label: 'Outgoing', color: DIRECTION_COLORS['Outgoing'] },
                  Incoming: { label: 'Incoming', color: DIRECTION_COLORS['Incoming'] },
                  Unknown: { label: 'Unknown', color: DIRECTION_COLORS['Unknown'] },
                }}
                className="aspect-auto h-[160px] w-full"
              >
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie data={directionData} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {directionData.map((entry) => (
                      <Cell key={entry.name} fill={DIRECTION_COLORS[entry.name]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex items-center justify-center gap-4 mt-2">
                {directionData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: DIRECTION_COLORS[entry.name] }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No calls logged.</p>
          )}
        </div>

        {/* Activity heatmap by day */}
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Activity by Day of Week</p>
          <p className="text-xs text-muted-foreground mb-3">When activities are typically logged</p>
          <ChartContainer config={heatmapConfig} className="aspect-auto h-[180px] w-full">
            <BarChart data={heatmapData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} className="stroke-border" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* Most active customers */}
      {a && a.mostActiveCustomers.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Most Active Customers
          </p>
          <div className="space-y-2.5">
            {a.mostActiveCustomers.map((c, i) => {
              const max = a.mostActiveCustomers[0]?.count ?? 1;
              const pct = Math.round((c.count / max) * 100);
              return (
                <div key={c.customerId}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">
                      <span className="text-muted-foreground mr-2">{i + 1}.</span>
                      {c.name}
                    </span>
                    <span className="text-muted-foreground">{c.count} activit{c.count !== 1 ? 'ies' : 'y'}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
