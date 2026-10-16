'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CalendarClock, Check, CheckSquare, Clock, ExternalLink, Inbox, Pencil, Plus, Search, Target, Trash2, X } from 'lucide-react';
import { ViewBar, ViewBarSeparator, ViewBarSpacer } from '@/components/ui/view-bar';
import { FullBleed } from '@/components/ui/full-bleed';
import { CompactPager } from '@/components/ui/compact-pager';
import { Segmented } from '@/components/ui/segmented';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { QuickAddButton } from '@/components/dashboard/QuickAddMenu';
import { ActivityTypeIcon } from '@/components/activities/ActivityTypeIcon';
import { ACTIVITY_ICONS, STATUS_CONFIG } from '@/components/activities/ActivityItem';
import { OpportunityStatusBadge, ExpiryLabel } from '@/components/opportunities/OpportunityBadges';
import { FollowUpEditDialog } from '@/components/followups/FollowUpEditDialog';
import { useAuthStore } from '@/store/authStore';
import { useCustomerStore } from '@/store/customerStore';
import { useFollowUpStore } from '@/store/followUpStore';
import { useOpportunityListStore } from '@/store/opportunityListStore';
import { useD365UserIdResolved } from '@/hooks/useD365UserId';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import { useShortcutListener } from '@/hooks/useShortcuts';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { onDataEvent } from '@/lib/dataEvents';
import { buildFeed, groupByDay, matchesFeedQuery, eventDate } from '@/lib/activity/feed';
import { completeFollowUpEverywhere } from '@/lib/followups/completeFollowUp';
import { deleteFollowUpEverywhere, saveFollowUpEverywhere } from '@/lib/followups/followUpActions';
import { deleteActivityEverywhere } from '@/lib/activities/deleteActivity';
import { overdueLabel, localDateKey } from '@/lib/today/home';
import { compactMoney, oppArr } from '@/lib/opportunities/display';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import { htmlIsEmpty } from '@/lib/utils/htmlUtils';
import { cn } from '@/lib/utils';
import type { Activity, FollowUp, Opportunity, TimelineEvent } from '@/types/entities';

export type ActivityMode = 'timeline' | 'followups';

const keyOf = (e: TimelineEvent) => `${e.kind}:${e.id}`;
const fmtDate = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' });

function Kv({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="m-0 grid grid-cols-[112px_minmax(0,1fr)] gap-x-2.5 gap-y-1.5 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="m-0 select-text break-words">{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

function FollowUpIcon({ done }: { done: boolean }) {
  return (
    <span className={cn('grid size-[26px] shrink-0 place-items-center rounded-[7px]', done ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
      {done ? <CheckSquare size={13} /> : <CalendarClock size={13} />}
    </span>
  );
}

/** Timeline and Your Follow-Ups as one page with a list on the left and the selected item on the right. */
export function ActivityPage({ mode }: { mode: ActivityMode }) {
  const router = useRouter();
  const account = useAuthStore((s) => s.account);
  const allContacts = useCustomerStore((s) => s.allContacts);
  const overdueCount = useFollowUpStore((s) => s.overdueCount);
  const { id: d365UserId, isResolved } = useD365UserIdResolved();
  const userId = d365UserId ?? account?.localAccountId ?? null;
  const { pageSize } = usePaginationPreference(mode === 'timeline' ? 'timeline' : 'followups');

  const [activities, setActivities] = useState<Activity[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [customerMap, setCustomerMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useShortcutListener('focus-search', useCallback(() => searchRef.current?.focus(), []));

  const load = useCallback(async () => {
    if (mode === 'followups' && !isResolved) return;
    try {
      if (!isTauriApp()) return;
      const [{ queryAllActivities }, followupsQ, { queryAllOpportunities }, { queryCustomerIdNameMap }] = await Promise.all([
        import('@/lib/db/queries/activities'),
        import('@/lib/db/queries/followups'),
        import('@/lib/db/queries/opportunities'),
        import('@/lib/db/queries/customers'),
      ]);
      if (mode === 'timeline') {
        const [acts, fups, opps, names] = await Promise.all([queryAllActivities(), followupsQ.queryAllFollowUps(), queryAllOpportunities(), queryCustomerIdNameMap()]);
        setActivities(acts);
        setFollowUps(fups);
        setOpportunities(opps);
        setCustomerMap(names);
      } else if (userId) {
        const [fups, names] = await Promise.all([followupsQ.queryFollowUpsByUser(userId, account?.localAccountId ?? undefined), queryCustomerIdNameMap()]);
        setFollowUps(fups);
        setCustomerMap(names);
      }
    } catch (err) {
      console.error(`[${mode === 'timeline' ? 'activity' : 'followup'}] Failed to load:`, err);
    } finally {
      setLoading(false);
    }
  }, [mode, isResolved, userId, account?.localAccountId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => onDataEvent(() => load()), [load]);

  useEffect(() => setPage(1), [query, mode]);

  const today = useMemo(() => new Date(), []);
  const todayKey = localDateKey(today);

  // ── Build the list ──
  const events = useMemo<TimelineEvent[]>(() => {
    if (mode === 'timeline') {
      return buildFeed(activities, followUps, opportunities).filter((e) => matchesFeedQuery(e, query, customerMap));
    }
    const q = query.trim().toLowerCase();
    const mine = followUps.filter((f) => !q || f.title.toLowerCase().includes(q) || (customerMap.get(f.customerId) ?? '').toLowerCase().includes(q));
    const due = (f: FollowUp) => f.dueDate.slice(0, 10);
    const overdue = mine.filter((f) => !f.completed && due(f) < todayKey).sort((a, b) => due(a).localeCompare(due(b)));
    const upcoming = mine.filter((f) => !f.completed && due(f) >= todayKey).sort((a, b) => due(a).localeCompare(due(b)));
    const done = mine.filter((f) => f.completed).sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
    return [...overdue, ...upcoming, ...done].map((f) => ({ kind: 'followup' as const, ...f }));
  }, [mode, activities, followUps, opportunities, query, customerMap, todayKey]);

  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = events.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selected = events.find((e) => keyOf(e) === selectedKey) ?? paged[0] ?? null;

  const groups = useMemo(() => {
    if (mode === 'timeline') return groupByDay(paged, today);
    const g: { label: string; tone?: 'neg'; events: TimelineEvent[] }[] = [];
    const push = (label: string, e: TimelineEvent, tone?: 'neg') => {
      const last = g[g.length - 1];
      if (last?.label === label) last.events.push(e);
      else g.push({ label, tone, events: [e] });
    };
    for (const e of paged) {
      if (e.kind !== 'followup') continue;
      if (e.completed) push('Completed', e);
      else if (e.dueDate.slice(0, 10) < todayKey) push('Overdue', e, 'neg');
      else push('Upcoming', e);
    }
    return g;
  }, [mode, paged, today, todayKey]);

  const groupCount = (label: string) =>
    mode === 'followups'
      ? events.filter((e) => e.kind === 'followup' && (label === 'Completed' ? e.completed : !e.completed && (label === 'Overdue' ? e.dueDate.slice(0, 10) < todayKey : e.dueDate.slice(0, 10) >= todayKey))).length
      : null;

  // ── Actions ──
  const customerName = (id: string) => customerMap.get(id) ?? '';
  const openCustomer = (id: string, extra = '') => router.push(`/customers?id=${id}${extra}`);

  const complete = async (f: FollowUp) => {
    try {
      const updated = await completeFollowUpEverywhere(f);
      setFollowUps((prev) => prev.map((x) => (x.id === f.id ? updated : x)));
    } catch (err) {
      console.error('[followup] Failed to complete:', err);
    }
  };

  const saveFollowUp = async (updated: FollowUp) => {
    await saveFollowUpEverywhere(updated, (remoteId) =>
      setFollowUps((prev) => prev.map((f) => (f.id === updated.id ? { ...updated, syncStatus: 'synced', remoteId } : f))),
    );
    setFollowUps((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const removeFollowUp = async (f: FollowUp) => {
    try {
      await deleteFollowUpEverywhere(f);
      setFollowUps((prev) => prev.filter((x) => x.id !== f.id));
    } catch (err) {
      console.error('[followup] Failed to delete:', err);
    }
  };

  const removeActivity = async (a: Activity) => {
    try {
      setActivities((prev) => prev.filter((x) => x.id !== a.id));
      await deleteActivityEverywhere(a.id, a.customerId);
    } catch (err) {
      console.error('[activity] Failed to delete:', err);
    }
  };

  const openInPipeline = (o: Opportunity) => {
    useOpportunityListStore.getState().setSelectedId(o.id);
    useOpportunityListStore.getState().setView('list');
    router.push('/opportunities');
  };

  // ── Rendering ──
  const completeBox = (f: FollowUp) =>
    f.completed ? (
      <span className="grid size-4 shrink-0 place-items-center rounded border-[1.5px] border-primary bg-primary text-primary-foreground">
        <Check size={11} />
      </span>
    ) : (
      <ConfirmPopover message={`Mark "${f.title}" as complete?`} confirmLabel="Complete" variant="default" align="start" onConfirm={() => complete(f)}>
        <button
          type="button"
          title="Mark as complete"
          onClick={(e) => e.stopPropagation()}
          className="group/check grid size-4 shrink-0 place-items-center rounded border-[1.5px] border-border-strong bg-card transition-colors hover:border-primary"
        >
          <Check size={11} className="text-transparent group-hover/check:text-primary" />
        </button>
      </ConfirmPopover>
    );

  const row = (e: TimelineEvent) => {
    const isSel = selected !== null && keyOf(selected) === keyOf(e);
    let icon: React.ReactNode;
    let title: string;
    let sub: string;
    let right: React.ReactNode = null;
    if (e.kind === 'activity') {
      icon = <ActivityTypeIcon type={e.type} />;
      title = e.subject;
      sub = customerName(e.customerId);
      right = <span className="whitespace-nowrap text-[11.5px] tabular-nums text-muted-foreground">{eventDate(e).slice(0, 10) === todayKey ? fmtTime(e.occurredAt) : fmtDate(e.occurredAt)}</span>;
    } else if (e.kind === 'followup') {
      icon = mode === 'followups' ? completeBox(e) : <FollowUpIcon done={e.completed} />;
      title = e.title;
      sub = mode === 'followups' ? customerName(e.customerId) : `${customerName(e.customerId)} · Due ${fmtDate(e.dueDate)}`;
      const late = !e.completed && e.dueDate.slice(0, 10) < todayKey;
      right =
        mode === 'followups' ? (
          <span className={cn('whitespace-nowrap text-[11.5px] tabular-nums', late ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
            {late ? overdueLabel(e.dueDate, today) : fmtDate(e.dueDate)}
          </span>
        ) : (
          <Badge variant={e.completed ? 'success' : 'warning'}>{e.completed ? 'Done' : 'Open'}</Badge>
        );
    } else {
      icon = (
        <span className="grid size-[26px] shrink-0 place-items-center rounded-[7px] bg-accent text-accent-foreground">
          <Target size={13} />
        </span>
      );
      title = e.subject;
      sub = `${e.stage} · ${compactMoney(oppArr(e), e.currency)}`;
      right = <OpportunityStatusBadge status={e.status} />;
    }
    return (
      <div
        key={keyOf(e)}
        role="option"
        aria-selected={isSel}
        onClick={() => setSelectedKey(keyOf(e))}
        className={cn(
          'relative flex min-w-0 cursor-default items-center gap-2.5 border-t border-border px-3 py-2 transition-colors',
          isSel ? 'bg-accent before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r before:bg-primary' : 'hover:bg-surface-2',
          e.kind === 'followup' && e.completed && mode === 'followups' && 'opacity-60',
        )}
      >
        {icon}
        <div className="min-w-0 flex-1">
          <div className={cn('truncate text-[13px] font-medium', e.kind === 'followup' && e.completed && mode === 'followups' && 'line-through')}>{title}</div>
          <div className="truncate text-xs text-muted-foreground">{sub}</div>
        </div>
        {e.kind === 'followup' && mode === 'followups' && e.syncStatus === 'pending' && !e.completed && <Badge variant="warning">Pending sync</Badge>}
        {right}
      </div>
    );
  };

  const reader = (() => {
    if (!selected) return null;
    if (selected.kind === 'activity') {
      const a = selected;
      const status = STATUS_CONFIG[a.activityStatus];
      const contact = a.contactId ? allContacts.find((c) => c.id === a.contactId) : undefined;
      return (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <ActivityTypeIcon type={a.type} />
            <Badge variant="secondary">{ACTIVITY_ICONS[a.type].label}</Badge>
            {a.type !== 'note' && status && <span className={cn('inline-flex h-5 items-center gap-1 rounded-full border px-[7px] text-[11px] font-medium', status.className)}>{status.label}</span>}
            <span className="text-xs text-muted-foreground">{fmtDate(a.occurredAt)}, {fmtTime(a.occurredAt)}</span>
          </div>
          <h2 className="text-lg font-semibold tracking-[-0.015em]">{a.subject}</h2>
          <Kv
            rows={[
              ['Customer', <button key="c" type="button" className="font-medium text-accent-foreground hover:underline" onClick={() => openCustomer(a.customerId)}>{customerName(a.customerId) || 'Open customer'}</button>],
              ['Contact', contact ? `${contact.firstName} ${contact.lastName}` : null],
              ['Created by', a.createdByName ? formatDisplayName(a.createdByName) : null],
            ]}
          />
          {a.description && !htmlIsEmpty(a.description) && (
            <div
              className="prose prose-sm max-w-[68ch] select-text rounded-md border border-border bg-sunken p-3 text-foreground-2 dark:prose-invert [&_h1]:my-2 [&_h2]:my-2 [&_li]:my-0 [&_ol]:my-1 [&_p]:my-1 [&_ul]:my-1"
              dangerouslySetInnerHTML={{ __html: a.description }}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openCustomer(a.customerId, `&tab=activities&action=edit-activity&activityId=${a.id}`)}>
              <Pencil size={13} /> Edit
            </Button>
            <Button variant="outline" onClick={() => openCustomer(a.customerId, '&tab=followups&action=followup')}>
              <Clock size={13} /> Create follow-up
            </Button>
            <ConfirmPopover message={`Delete "${a.subject}"?`} confirmLabel="Delete" onConfirm={() => removeActivity(a)}>
              <Button variant="outline" className="text-destructive">
                <Trash2 size={13} /> Delete
              </Button>
            </ConfirmPopover>
            <Button variant="ghost" onClick={() => openCustomer(a.customerId)}>
              <ExternalLink size={13} /> Open customer
            </Button>
          </div>
        </>
      );
    }
    if (selected.kind === 'followup') {
      const f = selected;
      const late = !f.completed && f.dueDate.slice(0, 10) < todayKey;
      return (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <FollowUpIcon done={f.completed} />
            <Badge variant={late ? 'destructive' : 'secondary'}>Due {fmtDate(f.dueDate)}</Badge>
            {f.completed && <Badge variant="success">Completed</Badge>}
            {!f.completed && f.syncStatus === 'pending' && <Badge variant="warning">Pending sync</Badge>}
          </div>
          <h2 className={cn('text-lg font-semibold tracking-[-0.015em]', f.completed && 'text-muted-foreground line-through')}>{f.title}</h2>
          <Kv
            rows={[
              ['Customer', <button key="c" type="button" className="font-medium text-accent-foreground hover:underline" onClick={() => openCustomer(f.customerId)}>{customerName(f.customerId) || 'Open customer'}</button>],
              ['Created by', f.createdByName ? formatDisplayName(f.createdByName) : null],
            ]}
          />
          <div className="min-h-20 max-w-[68ch] select-text whitespace-pre-wrap rounded-md border border-border bg-sunken p-3 text-[13.5px] leading-relaxed text-foreground-2">
            {f.description || <span className="text-muted-foreground">No description</span>}
          </div>
          {!f.completed && (
            <div className="flex flex-wrap gap-2">
              <ConfirmPopover message={`Mark "${f.title}" as complete?`} confirmLabel="Complete" variant="default" align="start" onConfirm={() => complete(f)}>
                <Button>
                  <Check size={13} /> Mark as complete
                </Button>
              </ConfirmPopover>
              <Button variant="outline" onClick={() => setEditingFollowUp(f)}>
                <Pencil size={13} /> Edit
              </Button>
              <ConfirmPopover message={`Delete "${f.title}"?`} confirmLabel="Delete" onConfirm={() => removeFollowUp(f)}>
                <Button variant="outline" className="text-destructive">
                  <Trash2 size={13} /> Delete
                </Button>
              </ConfirmPopover>
            </div>
          )}
        </>
      );
    }
    const o = selected;
    return (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <span className="grid size-[26px] place-items-center rounded-[7px] bg-accent text-accent-foreground">
            <Target size={13} />
          </span>
          <OpportunityStatusBadge status={o.status} />
          <Badge variant="secondary">{o.stage}</Badge>
          {o.status === 'Open' && <ExpiryLabel date={o.expirationDate} />}
        </div>
        <h2 className="text-lg font-semibold tracking-[-0.015em]">{o.subject}</h2>
        <Kv
          rows={[
            ['Customer', <button key="c" type="button" className="font-medium text-accent-foreground hover:underline" onClick={() => openCustomer(o.customerId)}>{customerName(o.customerId) || 'Open customer'}</button>],
            ['Value', compactMoney(oppArr(o), o.currency)],
            ['Vendor', o.primaryVendor],
            ['Owner', o.createdByName ? formatDisplayName(o.createdByName) : null],
          ]}
        />
        <div className="flex gap-2">
          <Button onClick={() => openInPipeline(o)}>
            <Target size={13} /> Open in Pipeline
          </Button>
          <Button variant="ghost" onClick={() => openCustomer(o.customerId)}>
            <Building2 size={13} /> Open customer
          </Button>
        </div>
      </>
    );
  })();

  return (
    <>
      <ViewBar title="Activity">
        <ViewBarSeparator />
        <Segmented<ActivityMode>
          aria-label="Activity view"
          value={mode}
          onChange={(m) => router.push(m === 'timeline' ? '/timeline' : '/followups')}
          options={[
            { value: 'timeline', label: 'Timeline' },
            {
              value: 'followups',
              label: (
                <>
                  Your Follow-Ups
                  {overdueCount > 0 && <span className="tabular-nums text-destructive">{overdueCount}</span>}
                </>
              ),
            },
          ]}
        />
        <ViewBarSpacer />
        {mode === 'timeline' ? (
          <QuickAddButton target="activity">
            <Plus size={14} /> Log activity
          </QuickAddButton>
        ) : (
          <QuickAddButton target="followup">
            <Plus size={14} /> New follow-up
          </QuickAddButton>
        )}
      </ViewBar>

      <FullBleed data-tour={mode === 'followups' ? 'page-followups' : 'page-timeline'} className="grid grid-cols-[340px_minmax(0,1fr)]">
        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border-r border-border bg-card">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-faint" />
              <Input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={mode === 'timeline' ? 'Search timeline…' : 'Search follow-ups…'}
                aria-label={mode === 'timeline' ? 'Search timeline' : 'Search follow-ups'}
                className="pl-7 pr-7"
              />
              {query && (
                <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          <div className="min-h-0 overflow-y-auto">
            {loading && isTauriApp() ? (
              <div className="grid">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 border-t border-border px-3 py-2.5 first:border-t-0">
                    <Skeleton className="size-[26px] rounded-[7px]" />
                    <div className="grid flex-1 gap-1.5">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              mode === 'timeline' ? (
                <EmptyState icon={Inbox} title="No events in the timeline yet" description="Log activities and add follow-ups to get started." />
              ) : (
                <EmptyState icon={CheckSquare} title="No follow-ups" description={query ? 'Nothing matches this search.' : 'Follow-ups you add on a customer show up here.'} />
              )
            ) : (
              <div role="listbox" aria-label={mode === 'timeline' ? 'Timeline' : 'Follow-ups'} className="stagger-in">
                {groups.map((g) => (
                  <div key={g.label}>
                    <div
                      className={cn(
                        'sticky top-0 z-[1] flex items-center gap-1.5 border-t border-border bg-surface-2 px-3 py-1.5 text-[11px] font-semibold',
                        'tone' in g && g.tone === 'neg' ? 'text-destructive' : 'text-muted-foreground',
                      )}
                    >
                      {g.label}
                      {groupCount(g.label) !== null && <Badge variant={'tone' in g && g.tone === 'neg' ? 'destructive' : 'secondary'}>{groupCount(g.label)}</Badge>}
                    </div>
                    {g.events.map(row)}
                  </div>
                ))}
              </div>
            )}
          </div>
          <CompactPager page={safePage} pageSize={pageSize} total={events.length} onPageChange={setPage} />
        </div>
        <div className="min-h-0 min-w-0 overflow-y-auto bg-card">
          {reader && <div className="grid max-w-[860px] content-start gap-3 px-5 pb-7 pt-4">{reader}</div>}
        </div>
      </FullBleed>

      <FollowUpEditDialog followUp={editingFollowUp} onClose={() => setEditingFollowUp(null)} onSave={saveFollowUp} />
    </>
  );
}
