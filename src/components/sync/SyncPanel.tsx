'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { CalendarCheck, CheckCircle, CheckCircle2, Loader2, RefreshCw, Target, Upload, WifiOff, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ViewBar, ViewBarSpacer } from '@/components/ui/view-bar';
import { MetricStrip, Metric } from '@/components/ui/metric-strip';
import { Panel, PanelHeader } from '@/components/ui/panel';
import { EmptyState } from '@/components/ui/empty-state';
import { CompactPager } from '@/components/ui/compact-pager';
import { ActivityTypeIcon } from '@/components/activities/ActivityTypeIcon';
import { useSync } from '@/hooks/useSync';
import { useSyncStore } from '@/store/syncStore';
import { useSettingsStore } from '@/store/settingsStore';
import { formatCurrency } from '@/lib/utils/currencyUtils';
import { formatDate, formatDateTime, formatRelative } from '@/lib/utils/dateUtils';
import { SYNC_TYPE_LABELS, pendingBreakdown, summarizeLastDay } from '@/lib/sync/historySummary';
import type { Activity } from '@/types/entities';
import type { SyncRecord } from '@/types/sync';
import type { PendingActivitySyncItem } from '@/lib/db/queries/activities';
import type { PendingFollowUpSyncItem } from '@/lib/db/queries/followups';
import type { PendingOpportunitySyncItem } from '@/lib/db/queries/opportunities';

const STATUS_CONFIG = {
  running: { icon: Loader2, variant: 'info' as const, label: 'Running' },
  success: { icon: CheckCircle, variant: 'success' as const, label: 'Success' },
  partial: { icon: AlertTriangle, variant: 'warning' as const, label: 'Partial' },
  error: { icon: XCircle, variant: 'destructive' as const, label: 'Error' },
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = { meeting: 'Meeting', visit: 'Visit', call: 'Call', note: 'Note' };
const isActivityType = (t: string): t is Activity['type'] => t in ACTIVITY_TYPE_LABELS;

const HISTORY_PAGE_SIZE = 20;

interface SyncPanelProps {
  records: SyncRecord[];
  pendingActivities: PendingActivitySyncItem[];
  pendingFollowUps: PendingFollowUpSyncItem[];
  pendingOpportunities: PendingOpportunitySyncItem[];
}

export function SyncPanel({ records, pendingActivities, pendingFollowUps, pendingOpportunities }: SyncPanelProps) {
  const {
    isSyncing, isOnline, lastD365SyncAt,
    pendingActivityCount, pendingFollowUpCount, pendingOpportunityCount, triggerSync, triggerPushPending,
  } = useSync();
  const syncIntervalMinutes = useSettingsStore((s) => s.syncIntervalMinutes);
  const syncPendingIntervalMinutes = useSettingsStore((s) => s.syncPendingIntervalMinutes);
  const syncPaused = useSettingsStore((s) => s.syncPaused);

  const totalPending = pendingActivityCount + pendingFollowUpCount + pendingOpportunityCount;
  const day = summarizeLastDay(records);
  const dayIssues = [day.errors ? `${day.errors} ${day.errors === 1 ? 'error' : 'errors'}` : null, day.partial ? `${day.partial} partial` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="grid content-start gap-3">
      <ViewBar title="Sync">
        <ViewBarSpacer />
        <Button variant="outline" onClick={triggerPushPending} disabled={isSyncing || !isOnline || totalPending === 0}>
          <Upload size={14} />
          Push pending
        </Button>
        <Button onClick={() => { triggerSync(); }} disabled={isSyncing || !isOnline}>
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing…' : 'Run full sync'}
        </Button>
      </ViewBar>

      {!isOnline && (
        <div className="flex items-center gap-2 rounded-[calc(var(--radius)*1.5)] border border-warning/40 bg-warning/10 px-3 py-2 text-[13px] text-warning">
          <WifiOff size={15} />
          You are offline. Connect to sync.
        </div>
      )}

      <MetricStrip>
        <Metric
          label="Last sync"
          value={lastD365SyncAt ? formatRelative(lastD365SyncAt) : 'Never'}
          sub={lastD365SyncAt ? `Dynamics 365 · ${formatDateTime(lastD365SyncAt)}` : 'Dynamics 365'}
        />
        <Metric
          label="Auto-sync"
          value={syncPaused ? 'Paused' : `Every ${syncIntervalMinutes} min`}
          sub={syncPaused ? 'Turn it back on in Settings' : `Pending changes every ${syncPendingIntervalMinutes} min`}
        />
        <Metric
          label="Pending changes"
          value={<span className={totalPending ? 'text-warning' : undefined}>{totalPending}</span>}
          sub={pendingBreakdown(pendingActivityCount, pendingFollowUpCount, pendingOpportunityCount)}
        />
        <Metric
          label="Last 24 hours"
          value={day.successRate === null ? '—' : `${day.successRate}%`}
          sub={day.runs === 0 ? 'No runs' : dayIssues || `${day.runs} ${day.runs === 1 ? 'run' : 'runs'}, all fine`}
        />
      </MetricStrip>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        <PendingQueue activities={pendingActivities} followUps={pendingFollowUps} opportunities={pendingOpportunities} />
        <SyncHistory records={records} />
      </div>
    </div>
  );
}

const rowClass = 'flex items-center gap-2.5 border-t border-border px-3 py-2 transition-colors first:border-t-0 hover:bg-surface-2';
const groupClass = 'flex items-center gap-1.5 border-y border-border bg-surface-2 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground first:border-t-0';

function PendingRow({ href, icon, title, meta, label }: { href: string; icon: ReactNode; title: string; meta: string; label: string }) {
  return (
    <Link href={href} className={rowClass}>
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{meta}</span>
      </span>
      <Badge variant="secondary">{label}</Badge>
    </Link>
  );
}

const tile = 'grid size-[26px] shrink-0 place-items-center rounded-[7px]';

function PendingQueue({
  activities,
  followUps,
  opportunities,
}: {
  activities: PendingActivitySyncItem[];
  followUps: PendingFollowUpSyncItem[];
  opportunities: PendingOpportunitySyncItem[];
}) {
  const total = activities.length + followUps.length + opportunities.length;
  return (
    <Panel aria-label="Waiting to sync">
      <PanelHeader title="Waiting to sync">{total > 0 && <Badge variant="warning">{total}</Badge>}</PanelHeader>
      {total === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing waiting" description="Every change is in Dynamics 365." />
      ) : (
        <div className="stagger-in max-h-[560px] overflow-y-auto">
          {activities.length > 0 && (
            <>
              <div className={groupClass}>Activities <span className="tabular-nums text-faint">{activities.length}</span></div>
              {activities.map((a) => (
                <PendingRow
                  key={a.id}
                  href={`/customers?id=${a.customerId}`}
                  icon={isActivityType(a.type) ? <ActivityTypeIcon type={a.type} /> : <span className={`${tile} bg-sunken`} />}
                  title={a.subject}
                  meta={`${a.customerName} · ${formatDateTime(a.occurredAt)}`}
                  label={ACTIVITY_TYPE_LABELS[a.type] ?? a.type}
                />
              ))}
            </>
          )}
          {followUps.length > 0 && (
            <>
              <div className={groupClass}>Follow-ups <span className="tabular-nums text-faint">{followUps.length}</span></div>
              {followUps.map((f) => (
                <PendingRow
                  key={f.id}
                  href={`/customers?id=${f.customerId}`}
                  icon={<span className={`${tile} bg-warning/15 text-warning`}><CalendarCheck size={14} /></span>}
                  title={f.title}
                  meta={`${f.customerName} · due ${formatDate(f.dueDate)}`}
                  label="Follow-up"
                />
              ))}
            </>
          )}
          {opportunities.length > 0 && (
            <>
              <div className={groupClass}>Opportunities <span className="tabular-nums text-faint">{opportunities.length}</span></div>
              {opportunities.map((o) => {
                const revenue = o.estimatedRevenue != null && o.currency ? formatCurrency(o.estimatedRevenue, o.currency) : null;
                return (
                  <PendingRow
                    key={o.id}
                    href={`/customers?id=${o.customerId}`}
                    icon={<span className={`${tile} bg-accent text-accent-foreground`}><Target size={14} /></span>}
                    title={o.subject}
                    meta={[o.customerName, o.primaryVendor, revenue].filter(Boolean).join(' · ')}
                    label={o.stage}
                  />
                );
              })}
            </>
          )}
        </div>
      )}
    </Panel>
  );
}

function SyncHistory({ records }: { records: SyncRecord[] }) {
  const { historyPage, setHistoryPage } = useSyncStore();
  const pages = Math.max(1, Math.ceil(records.length / HISTORY_PAGE_SIZE));
  const page = Math.min(historyPage, pages);
  const paged = records.slice((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE);
  const th = 'h-8 border-b border-border bg-surface-2 px-3 text-left text-[11px] font-semibold text-muted-foreground';

  return (
    <Panel>
      <PanelHeader title="History" sub={records.length ? `last ${records.length} runs` : undefined} />
      {records.length === 0 ? (
        <EmptyState icon={RefreshCw} title="No sync runs yet" description="Runs show up here after the first sync." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className={th}>Status</th>
                  <th className={th}>Type</th>
                  <th className={th}>When</th>
                  <th className={`${th} text-right`}>Pulled</th>
                  <th className={`${th} text-right`}>Pushed</th>
                </tr>
              </thead>
              <tbody className="stagger-in">
                {paged.map((r) => {
                  const config = STATUS_CONFIG[r.status];
                  const Icon = config.icon;
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-border transition-colors first:border-t-0 hover:bg-surface-2"
                    >
                      <td className="px-3 py-2 align-top">
                        <Badge variant={config.variant}>
                          <Icon size={11} className={r.status === 'running' ? 'animate-spin' : ''} />
                          {config.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 align-top">
                        {SYNC_TYPE_LABELS[r.syncType] ?? r.syncType}
                        {r.errorMessage && <p className="mt-0.5 max-w-[320px] text-xs text-destructive">{r.errorMessage}</p>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 align-top tabular-nums text-muted-foreground">{formatDateTime(r.startedAt)}</td>
                      <td className="px-3 py-2 text-right align-top tabular-nums">{r.recordsPulled.toLocaleString('en')}</td>
                      <td className="px-3 py-2 text-right align-top tabular-nums">{r.recordsPushed.toLocaleString('en')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <CompactPager page={page} pageSize={HISTORY_PAGE_SIZE} total={records.length} onPageChange={setHistoryPage} />
        </>
      )}
    </Panel>
  );
}
