'use client';

import { useEffect, useState } from 'react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { useD365UserId } from '@/hooks/useD365UserId';
import { MetricCard } from '@/components/analytics/MetricCard';
import { PeriodPicker, periodToRange, prevPeriodRange } from '@/components/analytics/PeriodPicker';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Activity, CheckSquare, Target, Trophy } from 'lucide-react';
import type { PeriodKey } from '@/types/analytics';

function fmt(n: number): string {
  return n.toLocaleString('nl-BE');
}

function fmtEur(n: number): string {
  return `€${n.toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const timelineConfig = {
  count: { label: 'Activities', color: 'hsl(var(--primary))' },
};

export function PersonalPanel() {
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const { account } = useAuthStore();
  const d365UserId = useD365UserId();
  const lastD365SyncAt = useSyncStore((s) => s.lastD365SyncAt);
  const userId = d365UserId ?? account?.localAccountId ?? '';

  const { personal, isLoadingPersonal, loadPersonal } = useAnalyticsStore();

  useEffect(() => {
    if (!userId) return;
    const range = periodToRange(period);
    const prev = prevPeriodRange(period);
    loadPersonal(userId, range, prev);
  }, [userId, period, lastD365SyncAt, loadPersonal]);

  if (isLoadingPersonal && !personal) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (!userId) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Unable to identify user. Sync with D365 first.</p>;
  }

  const p = personal;
  const actDelta = p ? p.activityCount.current - p.activityCount.previous : 0;
  const completionPct = p && p.followUpCompletion.total > 0
    ? Math.round((p.followUpCompletion.completed / p.followUpCompletion.total) * 100)
    : 0;
  const winPct = p && (p.winRate.won + p.winRate.lost) > 0
    ? Math.round((p.winRate.won / (p.winRate.won + p.winRate.lost)) * 100)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">My Performance</h2>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="My Activities"
          value={p ? fmt(p.activityCount.current) : '—'}
          icon={Activity}
          delta={actDelta}
          deltaLabel="vs prior period"
        />
        <MetricCard
          label="Follow-Up Completion"
          value={p ? `${completionPct}%` : '—'}
          icon={CheckSquare}
          sub={p ? `${p.followUpCompletion.completed} / ${p.followUpCompletion.total} completed` : undefined}
        />
        <MetricCard
          label="Open Pipeline"
          value={p ? fmtEur(p.pipeline.openValue) : '—'}
          icon={Target}
          sub={p ? `${p.pipeline.openCount} open deal${p.pipeline.openCount !== 1 ? 's' : ''}` : undefined}
        />
        <MetricCard
          label="Win Rate"
          value={winPct !== null ? `${winPct}%` : '—'}
          icon={Trophy}
          sub={p ? `${p.winRate.won}W / ${p.winRate.lost}L` : undefined}
        />
      </div>

      {/* Activity timeline */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          My Activity Timeline
        </p>
        <p className="text-xs text-muted-foreground mb-4">Activities logged per day</p>
        {p && p.activityTimeline.length > 0 ? (
          <ChartContainer config={timelineConfig} className="aspect-auto h-[200px] w-full">
            <AreaChart data={p.activityTimeline} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="fill-personal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} className="stroke-border" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              <Area
                dataKey="count"
                type="monotone"
                fill="url(#fill-personal)"
                stroke="var(--color-count)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">No activities logged in this period.</p>
        )}
      </div>

      {/* Follow-up detail */}
      {p && p.followUpCompletion.total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Completed Follow-Ups</p>
            <p className="mt-2 text-2xl font-semibold">{p.followUpCompletion.completed}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Created</p>
            <p className="mt-2 text-2xl font-semibold">{p.followUpCompletion.total}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Avg Days to Complete</p>
            <p className="mt-2 text-2xl font-semibold">
              {p.followUpCompletion.avgDaysToComplete > 0 ? `${p.followUpCompletion.avgDaysToComplete}d` : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Weighted forecast */}
      {p && (
        <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Weighted Forecast (My Pipeline)</p>
          <p className="mt-2 text-2xl font-semibold">{fmtEur(p.pipeline.weightedForecast)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">probability-adjusted open pipeline</p>
        </div>
      )}
    </div>
  );
}
