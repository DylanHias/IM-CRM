'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CalendarClock, Check, CheckCircle2, Clock, Plus, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import { listContainerVariants, listItemVariants } from '@/lib/motion';
import { ViewBar, ViewBarSpacer } from '@/components/ui/view-bar';
import { Panel, PanelHeader, PanelBody, PanelLink } from '@/components/ui/panel';
import { MetricStrip, Metric } from '@/components/ui/metric-strip';
import { HBars } from '@/components/ui/hbars';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { Skeleton } from '@/components/ui/skeleton';
import { CompactPager } from '@/components/ui/compact-pager';
import { QuickAddButton } from '@/components/dashboard/QuickAddMenu';
import { ActivityTypeIcon } from '@/components/activities/ActivityTypeIcon';
import { CobwebOverlay } from '@/components/easterEggs/CobwebOverlay';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { useCustomerStore } from '@/store/customerStore';
import { useCustomers } from '@/hooks/useCustomers';
import { usePagedRows } from '@/hooks/usePagedRows';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { completeFollowUpEverywhere } from '@/lib/followups/completeFollowUp';
import { onDataEvent } from '@/lib/dataEvents';
import { STAGES } from '@/lib/opportunityRules';
import { selectDueToday, workWeek, isoWeekNumber, overdueLabel, winRatePct } from '@/lib/today/home';
import { cn } from '@/lib/utils';
import type { Activity, FollowUp } from '@/types/entities';
import type { StaleOpportunity } from '@/lib/db/queries/opportunities';

const DAY_MS = 86_400_000;

function fmtEur(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `€${Math.round(n / 1_000)}K`;
  return `€${Math.round(n)}`;
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

function whenLabel(iso: string, now: Date): string {
  const d = new Date(iso);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (d.getTime() >= startToday) return d.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });
  if (d.getTime() >= startToday - DAY_MS) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

interface HomeData {
  recentActivities: Activity[];
  followUps: FollowUp[];
  openPipeline: number;
  pipelinePrevious: number;
  lifetimeArr: { total: number; count: number };
  winRate: { won: number; lost: number };
  stale: StaleOpportunity[];
  byStage: { stage: string; total: number }[];
  forUserId: string;
}
let cache: HomeData | null = null;

export default function DashboardPage() {
  const router = useRouter();
  const account = useAuthStore((s) => s.account);
  const callerD365UserId = useSyncStore((s) => s.callerD365UserId);
  const customers = useCustomerStore((s) => s.customers);
  const userId = callerD365UserId ?? account?.localAccountId ?? null;
  const altUserId = account?.localAccountId && account.localAccountId !== userId ? account.localAccountId : null;

  useCustomers();

  const [data, setData] = useState<HomeData | null>(cache);
  const [loading, setLoading] = useState(cache === null);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedFor = useRef<string | null>(null);
  const now = useMemo(() => new Date(), []);

  useEffect(() => onDataEvent((e) => {
    if (e.entity === 'followup' || e.entity === 'activity' || e.entity === 'opportunity') setReloadKey((k) => k + 1);
  }), []);

  useEffect(() => {
    if (!isTauriApp() || !userId) {
      setLoading(false);
      return;
    }
    if (reloadKey === 0 && loadedFor.current === userId && cache?.forUserId === userId) return;

    const load = async () => {
      try {
        const userIds = [userId, altUserId].filter((v): v is string => Boolean(v));
        const since = new Date(Date.now() - 90 * DAY_MS).toISOString();
        const [analytics, followups, activities, opportunities] = await Promise.all([
          import('@/lib/db/queries/analytics'),
          import('@/lib/db/queries/followups'),
          import('@/lib/db/queries/activities'),
          import('@/lib/db/queries/opportunities'),
        ]);
        const [recentActivities, followUps, pipeline, delta, winRate, stale, byStage, lifetimeArr] = await Promise.all([
          activities.queryMyRecentActivitiesLatest(userId, altUserId, 50),
          followups.queryFollowUpsByUser(userId, altUserId ?? undefined),
          analytics.queryMyPipeline(userIds),
          analytics.queryMyPipelineWeeklyDelta(userIds),
          analytics.queryMyWinRateSince(userIds, since),
          opportunities.queryMyStaleOpportunities(userId, altUserId, 30, 50),
          analytics.queryMyPipelineByStage(userIds),
          analytics.queryMyLifetimeArr(userIds),
        ]);
        cache = {
          recentActivities,
          followUps,
          openPipeline: pipeline.openValue,
          pipelinePrevious: delta.previousValue,
          lifetimeArr,
          winRate,
          stale,
          byStage,
          forUserId: userId,
        };
        loadedFor.current = userId;
        setData(cache);
      } catch (err) {
        console.error('[dashboard] Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, altUserId, reloadKey]);

  const followUps = data?.followUps ?? [];
  const dueToday = selectDueToday(followUps, now);
  const overdueCount = dueToday.filter((f) => overdueLabel(f.dueDate, now) !== 'Today').length;
  const week = workWeek(followUps, now);
  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? '';

  const pipelineDelta = data ? pctDelta(data.openPipeline, data.pipelinePrevious) : null;
  const winRate = data ? winRatePct(data.winRate) : null;
  const stageRows = STAGES.filter((s) => s !== 'Purchased' && s !== 'Billing Rejection').map((s) => ({
    label: s,
    value: data?.byStage.find((r) => r.stage === s)?.total ?? 0,
  }));

  const due = usePagedRows(dueToday, 44);
  const recent = usePagedRows(data?.recentActivities ?? [], 52);
  const quiet = usePagedRows(data?.stale ?? [], 48);

  const complete = async (f: FollowUp) => {
    try {
      const updated = await completeFollowUpEverywhere(f);
      setData((prev) => (prev ? { ...prev, followUps: prev.followUps.map((x) => (x.id === f.id ? updated : x)) } : prev));
    } catch (err) {
      console.error('[followup] Failed to complete from Home:', err);
    }
  };

  const dash = loading ? <Skeleton className="h-6 w-20" /> : null;

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <ViewBar
        title="Home"
        meta={`${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · Week ${isoWeekNumber(now)}`}
      >
        <ViewBarSpacer />
        <QuickAddButton target="followup" variant="outline">
          <Clock size={14} />
          New follow-up
        </QuickAddButton>
        <QuickAddButton target="activity">
          <Plus size={14} />
          Log activity
        </QuickAddButton>
      </ViewBar>

      <MetricStrip aria-label="Key figures">
        <Metric
          label="Open pipeline"
          value={dash ?? fmtEur(data?.openPipeline ?? 0)}
          delta={pipelineDelta !== null ? { text: `${pipelineDelta >= 0 ? '+' : '−'}${Math.abs(pipelineDelta).toFixed(1)}%`, positive: pipelineDelta >= 0 } : undefined}
          sub={pipelineDelta !== null ? 'vs 7 days ago' : 'ARR on your open deals'}
        />
        <Metric
          label="Lifetime ARR"
          value={dash ?? fmtEur(data?.lifetimeArr.total ?? 0)}
          sub={data ? `${data.lifetimeArr.count} ${data.lifetimeArr.count === 1 ? 'opportunity' : 'opportunities'} all-time` : undefined}
        />
        <Metric
          label="Win rate · 90 days"
          value={dash ?? (winRate === null ? '—' : `${winRate}%`)}
          sub={data ? `${data.winRate.won} won · ${data.winRate.lost} lost` : undefined}
        />
        <Metric
          label="Follow-ups due today"
          value={dash ?? dueToday.length}
          aside={<PanelLink onClick={() => router.push('/followups')}>Open tasks</PanelLink>}
          sub={
            overdueCount > 0 ? (
              <Badge variant="destructive"><AlertCircle size={11} /> {overdueCount} overdue</Badge>
            ) : (
              <Badge variant="success">Nothing overdue</Badge>
            )
          }
        />
      </MetricStrip>

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-3 lg:min-h-0 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
          <Panel className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]">
            <PanelHeader title="Due today" sub={`${dueToday.length} open`} />
            {dueToday.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="Nothing due today" description="Enjoy the quiet." />
            ) : (
              <motion.ul ref={due.ref} variants={listContainerVariants} initial="hidden" animate="visible" className="min-h-0 overflow-y-auto">
                {due.visible.map((f) => {
                  const label = overdueLabel(f.dueDate, now);
                  return (
                    <motion.li
                      key={f.id}
                      variants={listItemVariants}
                      className="flex min-h-10 items-center gap-2.5 border-t border-border px-3 py-1.5 first:border-t-0 hover:bg-surface-2"
                    >
                      <ConfirmPopover message={`Mark "${f.title}" as complete?`} confirmLabel="Complete" variant="default" align="start" onConfirm={() => complete(f)}>
                        <button
                          type="button"
                          title="Mark as complete"
                          className="group/check grid size-4 shrink-0 place-items-center rounded border-[1.5px] border-border-strong bg-card transition-colors hover:border-primary"
                        >
                          <Check size={11} className="text-transparent group-hover/check:text-primary" />
                        </button>
                      </ConfirmPopover>
                      <button
                        type="button"
                        onClick={() => router.push(`/customers?id=${f.customerId}&tab=followups`)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="truncate text-[13px] font-medium">{f.title}</div>
                        <div className="truncate text-xs text-muted-foreground">{customerName(f.customerId)}</div>
                      </button>
                      <span className={cn('shrink-0 whitespace-nowrap text-[11.5px] tabular-nums', label === 'Today' ? 'text-muted-foreground' : 'font-semibold text-destructive')}>
                        {label}
                      </span>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
            <CompactPager page={due.page} pageSize={due.pageSize} total={dueToday.length} onPageChange={due.setPage} />
          </Panel>

          <Panel className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]">
            <PanelHeader title="Recent activity">
              <PanelLink onClick={() => router.push('/timeline')}>Open timeline</PanelLink>
            </PanelHeader>
            {(data?.recentActivities.length ?? 0) === 0 ? (
              <EmptyState icon={Inbox} title="No activity yet" description="Activities you log on a customer show up here." />
            ) : (
              <ul ref={recent.ref} className="min-h-0 overflow-y-auto">
                {recent.visible.map((a) => (
                  <li key={a.id} className="border-t border-border first:border-t-0">
                    <button
                      type="button"
                      onClick={() => router.push(`/customers?id=${a.customerId}&tab=activities`)}
                      className="grid w-full grid-cols-[30px_minmax(0,1fr)_auto] items-start gap-2.5 px-3 py-2.5 text-left hover:bg-surface-2"
                    >
                      <ActivityTypeIcon type={a.type} />
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium">{a.subject}</div>
                        <p className="truncate text-xs text-muted-foreground">{customerName(a.customerId)}</p>
                      </div>
                      <span className="whitespace-nowrap text-[11.5px] tabular-nums text-muted-foreground">{whenLabel(a.occurredAt, now)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <CompactPager page={recent.page} pageSize={recent.pageSize} total={data?.recentActivities.length ?? 0} onPageChange={recent.setPage} />
          </Panel>
        </div>

        <div className="grid min-w-0 gap-3 lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)_auto]">
          <Panel>
            <PanelHeader title="This week" sub="Follow-ups per day" />
            <PanelBody>
              <div className="grid grid-cols-5 gap-1.5">
                {week.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => router.push('/followups')}
                    title={`${d.count} ${d.count === 1 ? 'follow-up' : 'follow-ups'}`}
                    className={cn(
                      'grid min-w-0 gap-1 rounded-md border px-2 py-1.5 text-left transition-colors',
                      d.isToday ? 'border-primary bg-accent' : 'border-border bg-card hover:border-border-strong',
                    )}
                  >
                    <span className={cn('text-[10.5px] uppercase tracking-[0.05em]', d.isToday ? 'text-accent-foreground' : 'text-muted-foreground')}>{d.label}</span>
                    <span className="text-base font-semibold tabular-nums">{d.day}</span>
                    <span className="flex min-h-1.5 flex-wrap gap-[3px]">
                      {Array.from({ length: Math.min(d.count, 12) }).map((_, i) => (
                        <i key={i} className={cn('size-1.5 rounded-full', d.isToday ? 'bg-primary' : 'bg-faint')} />
                      ))}
                    </span>
                  </button>
                ))}
              </div>
            </PanelBody>
          </Panel>

          <Panel className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]">
            <PanelHeader title="Deals going quiet">
              <Badge variant="warning">30+ days idle</Badge>
            </PanelHeader>
            {(data?.stale.length ?? 0) === 0 ? (
              <EmptyState icon={CalendarClock} title="No deals going quiet" description="Every open deal had an update in the last 30 days." />
            ) : (
              <ul ref={quiet.ref} className="min-h-0 overflow-y-auto">
                {quiet.visible.map((o) => (
                  <li key={o.id} className="relative border-t border-border first:border-t-0">
                    <CobwebOverlay daysStale={o.daysStale} />
                    <button
                      type="button"
                      onClick={() => router.push(`/customers?id=${o.customerId}&tab=opportunities`)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{o.subject}</div>
                        <div className="truncate text-xs text-muted-foreground">{o.customerName} · {o.stage}</div>
                      </div>
                      <div className="text-right">
                        <div className="whitespace-nowrap font-semibold tabular-nums">{o.estimatedRevenue != null ? fmtEur(o.estimatedRevenue) : '—'}</div>
                        <div className="whitespace-nowrap text-[11.5px] font-semibold tabular-nums text-warning">{o.daysStale} days</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <CompactPager page={quiet.page} pageSize={quiet.pageSize} total={data?.stale.length ?? 0} onPageChange={quiet.setPage} />
          </Panel>

          <Panel>
            <PanelHeader title="Open pipeline by stage">
              <PanelLink onClick={() => router.push('/opportunities')}>Open pipeline</PanelLink>
            </PanelHeader>
            <PanelBody>
              <HBars rows={stageRows} format={fmtEur} />
            </PanelBody>
          </Panel>
        </div>
      </div>
    </div>
  );
}
