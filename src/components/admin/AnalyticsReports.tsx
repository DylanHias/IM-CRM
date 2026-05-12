'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  RefreshCw, Search, X, ArrowUp, ArrowDown,
  Activity, CheckSquare, Target, Trophy, Users,
  ChevronRight, AlertCircle, AlertTriangle, Calendar,
  Phone, FileText, MapPin, BarChart3,
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { d365Request } from '@/lib/auth/msalConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
} from '@/components/ui/chart';
import { MetricCard } from '@/components/analytics/MetricCard';
import { TableRowsSkeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type {
  AnalyticsRangeKey, LeaderboardRow, UserDrilldown,
} from '@/types/admin';

interface Props {
  onGoToUsers?: () => void;
}

type SortField =
  | 'name' | 'activityTotal' | 'meetings' | 'calls' | 'visits' | 'notes'
  | 'followupsCreated' | 'followupsCompleted' | 'followupCompletionPct'
  | 'oppsCreated' | 'oppsCreatedValue' | 'oppsWon' | 'oppsWonValue' | 'oppsLost'
  | 'winRatePct' | 'customersTouched';

const RANGE_LABELS: Record<AnalyticsRangeKey, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  qtd: 'Quarter to date',
};

const ACTIVITY_TYPES = ['meeting', 'call', 'visit', 'note'] as const;
type ActivityType = (typeof ACTIVITY_TYPES)[number];

const ACTIVITY_ICONS: Record<ActivityType, typeof Phone> = {
  meeting: Calendar,
  call: Phone,
  visit: MapPin,
  note: FileText,
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  meeting: 'Meeting',
  call: 'Call',
  visit: 'Visit',
  note: 'Note',
};

const timelineConfig = {
  meeting: { label: 'Meeting', color: 'hsl(var(--primary))' },
  call: { label: 'Call', color: 'hsl(var(--chart-2, 220 70% 50%))' },
  visit: { label: 'Visit', color: 'hsl(var(--chart-3, 150 60% 40%))' },
  note: { label: 'Note', color: 'hsl(var(--chart-4, 280 65% 60%))' },
};

function fmt(n: number): string {
  return n.toLocaleString('nl-BE');
}

function fmtEur(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}k`;
  return `€${n.toLocaleString('nl-BE')}`;
}

function fmtEurExact(n: number): string {
  return `€${n.toLocaleString('nl-BE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

function daysAgo(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff <= 0) return 'today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
}

export function AnalyticsReports({ onGoToUsers }: Props) {
  const {
    leaderboard, zeroActivityUsers, overdueByUser, drilldowns, analyticsRange,
    isLoadingAnalytics, isRefreshingFromD365, drilldownLoading,
    loadTeamAnalytics, loadUserDrilldown, refreshAnalyticsFromD365,
  } = useAdminStore();

  const [rangeKey, setRangeKey] = useState<AnalyticsRangeKey>('30d');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('activityTotal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    loadTeamAnalytics(rangeKey);
  }, [rangeKey, loadTeamAnalytics]);

  const filtered = useMemo<LeaderboardRow[]>(() => {
    const q = search.trim().toLowerCase();
    const rows = q ? leaderboard.filter((r) => r.userName.toLowerCase().includes(q)) : leaderboard;
    const cmp = (a: LeaderboardRow, b: LeaderboardRow): number => {
      if (sortBy === 'name') return a.userName.localeCompare(b.userName);
      const av = (a[sortBy] as number | null) ?? -Infinity;
      const bv = (b[sortBy] as number | null) ?? -Infinity;
      return (av as number) - (bv as number);
    };
    return [...rows].sort((a, b) => sortDir === 'asc' ? cmp(a, b) : -cmp(a, b));
  }, [leaderboard, search, sortBy, sortDir]);

  const teamTotals = useMemo(() => {
    return leaderboard.reduce((acc, r) => ({
      activities: acc.activities + r.activityTotal,
      followupsCompleted: acc.followupsCompleted + r.followupsCompleted,
      followupsCreated: acc.followupsCreated + r.followupsCreated,
      oppsCreated: acc.oppsCreated + r.oppsCreated,
      oppsCreatedValue: acc.oppsCreatedValue + r.oppsCreatedValue,
      oppsWon: acc.oppsWon + r.oppsWon,
      oppsLost: acc.oppsLost + r.oppsLost,
    }), { activities: 0, followupsCompleted: 0, followupsCreated: 0, oppsCreated: 0, oppsCreatedValue: 0, oppsWon: 0, oppsLost: 0 });
  }, [leaderboard]);

  const teamCompletion = teamTotals.followupsCreated > 0
    ? Math.round((teamTotals.followupsCompleted / teamTotals.followupsCreated) * 100)
    : 0;
  const teamClosed = teamTotals.oppsWon + teamTotals.oppsLost;
  const teamWin = teamClosed > 0 ? Math.round((teamTotals.oppsWon / teamClosed) * 100) : null;

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'name' ? 'asc' : 'desc');
    }
  }

  async function handleExpand(userId: string) {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    if (!drilldowns[userId]) {
      await loadUserDrilldown(userId, rangeKey);
    }
  }

  async function handleRefresh() {
    try {
      const token = await getAccessToken(d365Request.scopes);
      if (!token) {
        console.error('[admin] Refresh failed: no D365 access token');
        return;
      }
      await refreshAnalyticsFromD365(token, rangeKey);
    } catch (err) {
      console.error('[admin] Refresh analytics failed:', err);
    }
  }

  // ── Empty state: no tracked users (only after first load completes) ─────
  if (analyticsRange !== null && !isLoadingAnalytics && leaderboard.length === 0) {
    return (
      <div className="space-y-6">
        <Header
          rangeKey={rangeKey}
          setRangeKey={setRangeKey}
          isRefreshing={isRefreshingFromD365}
          onRefresh={handleRefresh}
        />
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center shadow-sm">
          <BarChart3 size={32} className="mx-auto text-muted-foreground/60 mb-3" />
          <h3 className="text-base font-semibold">No users tracked yet</h3>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-md mx-auto">
            Pick which team members should appear in this leaderboard from the Users tab.
            Their activities, follow-ups, and opportunities will then be shown here.
          </p>
          <Button className="mt-4" onClick={onGoToUsers}>
            Go to Users
            <ChevronRight size={14} className="ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        <Header
          rangeKey={rangeKey}
          setRangeKey={setRangeKey}
          isRefreshing={isRefreshingFromD365}
          onRefresh={handleRefresh}
        />

        {/* Team totals — sum of every tracked rep */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <MetricCard
            label="Team Activities"
            value={isLoadingAnalytics ? '—' : fmt(teamTotals.activities)}
            icon={Activity}
            sub={`${leaderboard.length} tracked rep${leaderboard.length !== 1 ? 's' : ''}`}
          />
          <MetricCard
            label="Follow-Up Completion"
            value={isLoadingAnalytics ? '—' : `${teamCompletion}%`}
            icon={CheckSquare}
            sub={`${teamTotals.followupsCompleted} / ${teamTotals.followupsCreated}`}
          />
          <MetricCard
            label="Opps Created"
            value={isLoadingAnalytics ? '—' : fmt(teamTotals.oppsCreated)}
            icon={Target}
            sub={teamTotals.oppsCreated > 0 ? fmtEur(teamTotals.oppsCreatedValue) : 'no new deals'}
          />
          <MetricCard
            label="Opps Won"
            value={isLoadingAnalytics ? '—' : fmt(teamTotals.oppsWon)}
            icon={Trophy}
            sub={`${teamTotals.oppsLost} lost`}
          />
          <MetricCard
            label="Win Rate"
            value={isLoadingAnalytics ? '—' : (teamWin !== null ? `${teamWin}%` : '—')}
            icon={Trophy}
            sub={teamClosed > 0 ? `${teamClosed} closed deals` : 'no closed deals'}
          />
        </div>

        {/* Alert cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <AlertCard
            title="Zero activities this period"
            tone={zeroActivityUsers.length > 0 ? 'warning' : 'ok'}
            icon={AlertCircle}
            emptyText="Every tracked rep logged at least one activity."
            items={zeroActivityUsers.map((u) => ({
              key: u.userId,
              primary: u.userName,
              photo: u.profilePhoto,
              secondary: `Last activity ${daysAgo(u.lastActivityAt)}`,
            }))}
          />
          <AlertCard
            title="Overdue follow-ups by rep"
            tone={overdueByUser.length > 0 ? 'destructive' : 'ok'}
            icon={AlertTriangle}
            emptyText="No overdue follow-ups across the team."
            items={overdueByUser.map((u) => ({
              key: u.userId,
              primary: u.userName,
              photo: u.profilePhoto,
              secondary: `${u.count} overdue`,
              badge: u.count,
            }))}
          />
        </div>

        {/* Leaderboard */}
        <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60 bg-muted/20">
            <div>
              <h2 className="text-sm font-semibold">Team Leaderboard</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {RANGE_LABELS[rangeKey]} · click a row for details
              </p>
            </div>
            <div className="relative w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input
                placeholder="Search rep…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-7 h-8 text-xs bg-card shadow-sm border-border/70 rounded-lg"
              />
              {search && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearch('')}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <SortableTh field="name" label="Rep" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} align="left" sticky />
                  <SortableTh field="activityTotal" label="Total" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} tooltip="All activities logged in range" />
                  <SortableTh field="meetings" label="Mtg" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} tooltip="Meetings" />
                  <SortableTh field="calls" label="Call" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} tooltip="Calls" />
                  <SortableTh field="visits" label="Visit" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} tooltip="Visits" />
                  <SortableTh field="notes" label="Note" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} tooltip="Notes" />
                  <SortableTh field="followupsCreated" label="FU New" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} tooltip="Follow-ups created" />
                  <SortableTh field="followupCompletionPct" label="FU %" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} tooltip="Follow-up completion rate" />
                  <SortableTh field="oppsCreated" label="Opps" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} tooltip="Opps created in range" />
                  <SortableTh field="oppsCreatedValue" label="Pipe €" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} tooltip="Sum of estimated revenue of opps created in range" />
                  <SortableTh field="oppsWon" label="Won" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} tooltip="Opportunities marked Won in range" />
                  <SortableTh field="winRatePct" label="Win %" sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} tooltip="Won / (Won + Lost) in range" />
                  <SortableTh field="customersTouched" label="Cust." sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} tooltip="Distinct customers with at least one activity" />
                  <th className="px-2 py-2.5 w-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoadingAnalytics ? (
                  <TableRowsSkeleton rows={5} cols={14} />
                ) : (
                  filtered.map((row) => (
                    <LeaderboardRowView
                      key={row.userId}
                      row={row}
                      expanded={expandedUserId === row.userId}
                      drilldown={drilldowns[row.userId]}
                      drilldownLoading={!!drilldownLoading[row.userId]}
                      onToggle={() => handleExpand(row.userId)}
                    />
                  ))
                )}
                {!isLoadingAnalytics && filtered.length === 0 && (
                  <tr>
                    <td colSpan={14} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No matches for &ldquo;{search}&rdquo;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ── Header ────────────────────────────────────────────────────────────────

function Header({
  rangeKey, setRangeKey, isRefreshing, onRefresh,
}: {
  rangeKey: AnalyticsRangeKey;
  setRangeKey: (k: AnalyticsRangeKey) => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold">Team Analytics</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Per-rep activity for {RANGE_LABELS[rangeKey].toLowerCase()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Select value={rangeKey} onValueChange={(v) => setRangeKey(v as AnalyticsRangeKey)}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="qtd">Quarter to date</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-9"
        >
          <RefreshCw size={14} className={cn(isRefreshing && 'animate-spin')} />
          <span className="ml-1.5">{isRefreshing ? 'Refreshing…' : 'Refresh from D365'}</span>
        </Button>
      </div>
    </div>
  );
}

// ── Alert card ────────────────────────────────────────────────────────────

interface AlertCardItem {
  key: string;
  primary: string;
  photo: string | null;
  secondary: string;
  badge?: number;
}

function AlertCard({
  title, items, emptyText, tone, icon: Icon,
}: {
  title: string;
  items: AlertCardItem[];
  emptyText: string;
  tone: 'ok' | 'warning' | 'destructive';
  icon: typeof AlertCircle;
}) {
  const toneClasses =
    tone === 'destructive'
      ? 'border-destructive/40 bg-destructive/5'
      : tone === 'warning'
      ? 'border-amber-500/40 bg-amber-500/5'
      : 'border-border/60 bg-card';
  const iconClasses =
    tone === 'destructive' ? 'text-destructive' :
    tone === 'warning' ? 'text-amber-600 dark:text-amber-400' :
    'text-emerald-600 dark:text-emerald-400';

  return (
    <div className={cn('rounded-xl border p-4 shadow-sm', toneClasses)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className={iconClasses} />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {items.length > 0 && (
          <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px]">
            {items.length}
          </Badge>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">{emptyText}</p>
      ) : (
        <ul className="space-y-2 max-h-[180px] overflow-y-auto">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-2.5">
              <Avatar className="h-7 w-7">
                {item.photo && <AvatarImage src={item.photo} alt={item.primary} />}
                <AvatarFallback className="text-[10px]">{initials(item.primary)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{item.primary}</p>
                <p className="text-[11px] text-muted-foreground">{item.secondary}</p>
              </div>
              {item.badge !== undefined && (
                <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{item.badge}</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Sortable header cell ──────────────────────────────────────────────────

function SortableTh({
  field, label, sortBy, sortDir, onToggle, align, tooltip, sticky,
}: {
  field: SortField;
  label: string;
  sortBy: SortField;
  sortDir: 'asc' | 'desc';
  onToggle: (f: SortField) => void;
  align?: 'left' | 'right';
  tooltip?: string;
  sticky?: boolean;
}) {
  const active = sortBy === field;
  const content = (
    <th
      className={cn(
        'px-2 py-2.5 font-semibold whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors',
        align === 'left' ? 'text-left' : 'text-right',
        sticky && 'sticky left-0 bg-muted/20 z-10 pl-4'
      )}
      onClick={() => onToggle(field)}
    >
      <span className={cn('inline-flex items-center gap-1', align !== 'left' && 'justify-end w-full')}>
        {label}
        {active && (sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}
      </span>
    </th>
  );
  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    );
  }
  return content;
}

// ── Leaderboard row + drilldown ───────────────────────────────────────────

function LeaderboardRowView({
  row, expanded, drilldown, drilldownLoading, onToggle,
}: {
  row: LeaderboardRow;
  expanded: boolean;
  drilldown: UserDrilldown | undefined;
  drilldownLoading: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={cn(
          'transition-colors cursor-pointer',
          expanded ? 'bg-muted/30' : 'hover:bg-muted/20'
        )}
        onClick={onToggle}
      >
        <td className="px-4 py-2.5 sticky left-0 bg-inherit z-10">
          <div className="flex items-center gap-2.5 min-w-[180px]">
            <Avatar className="h-7 w-7 shrink-0">
              {row.profilePhoto && <AvatarImage src={row.profilePhoto} alt={row.userName} />}
              <AvatarFallback className="text-[10px]">{initials(row.userName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{row.userName}</p>
              {row.title && <p className="text-[11px] text-muted-foreground truncate">{row.title}</p>}
            </div>
          </div>
        </td>
        <td className="px-2 py-2.5 text-right tabular-nums font-semibold">{fmt(row.activityTotal)}</td>
        <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">{fmt(row.meetings)}</td>
        <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">{fmt(row.calls)}</td>
        <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">{fmt(row.visits)}</td>
        <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">{fmt(row.notes)}</td>
        <td className="px-2 py-2.5 text-right tabular-nums">{fmt(row.followupsCreated)}</td>
        <td className="px-2 py-2.5 text-right tabular-nums">
          {row.followupsCreated > 0 ? (
            <span className={cn(
              'inline-flex items-center justify-end gap-0.5',
              row.followupCompletionPct >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
              row.followupCompletionPct >= 40 ? 'text-foreground' :
              'text-amber-600 dark:text-amber-400'
            )}>
              {row.followupCompletionPct}%
            </span>
          ) : <span className="text-muted-foreground">—</span>}
        </td>
        <td className="px-2 py-2.5 text-right tabular-nums">{fmt(row.oppsCreated)}</td>
        <td className="px-2 py-2.5 text-right tabular-nums text-muted-foreground">
          {row.oppsCreatedValue > 0 ? fmtEur(row.oppsCreatedValue) : '—'}
        </td>
        <td className="px-2 py-2.5 text-right tabular-nums">
          {row.oppsWon > 0 ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{row.oppsWon}</span>
          ) : '0'}
        </td>
        <td className="px-2 py-2.5 text-right tabular-nums">
          {row.winRatePct !== null ? `${row.winRatePct}%` : <span className="text-muted-foreground">—</span>}
        </td>
        <td className="px-2 py-2.5 text-right tabular-nums">{fmt(row.customersTouched)}</td>
        <td className="px-2 py-2.5 text-muted-foreground">
          <ChevronRight
            size={14}
            className={cn('transition-transform', expanded && 'rotate-90')}
          />
        </td>
      </tr>
      {expanded && (
        <tr className="bg-muted/10">
          <td colSpan={14} className="px-0 py-0">
            <DrilldownPanel
              userId={row.userId}
              userName={row.userName}
              row={row}
              drilldown={drilldown}
              isLoading={drilldownLoading}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Drilldown panel ───────────────────────────────────────────────────────

function DrilldownPanel({
  userName, row, drilldown, isLoading,
}: {
  userId: string;
  userName: string;
  row: LeaderboardRow;
  drilldown: UserDrilldown | undefined;
  isLoading: boolean;
}) {
  if (isLoading || !drilldown) {
    return (
      <div className="px-6 py-8 text-center text-sm text-muted-foreground">
        Loading {userName}&apos;s details…
      </div>
    );
  }

  return (
    <div className="px-6 py-5 space-y-5 border-t border-border/60">
      {/* Mini-stat strip specific to this user */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total Activities"
          value={fmt(row.activityTotal)}
          icon={Activity}
          sub={`${row.customersTouched} customers touched`}
        />
        <MetricCard
          label="Follow-ups"
          value={`${row.followupsCompleted} / ${row.followupsCreated}`}
          icon={CheckSquare}
          sub={row.followupsCreated > 0 ? `${row.followupCompletionPct}% completion` : 'none created'}
        />
        <MetricCard
          label="Open Pipeline"
          value={drilldown.openOppsValue > 0 ? fmtEurExact(drilldown.openOppsValue) : '—'}
          icon={Target}
          sub={`${drilldown.openOpps.length} open deal${drilldown.openOpps.length !== 1 ? 's' : ''}`}
        />
        <MetricCard
          label="Won / Lost"
          value={`${row.oppsWon} / ${row.oppsLost}`}
          icon={Trophy}
          sub={row.winRatePct !== null ? `${row.winRatePct}% win rate` : 'no closed deals'}
        />
      </div>

      {/* Activity timeline */}
      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity Timeline</p>
            <p className="text-xs text-muted-foreground mt-0.5">Activities per day, stacked by type</p>
          </div>
        </div>
        {drilldown.timeline.some((p) => p.meeting + p.call + p.visit + p.note > 0) ? (
          <ChartContainer config={timelineConfig} className="aspect-auto h-[200px] w-full">
            <AreaChart data={drilldown.timeline} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                {ACTIVITY_TYPES.map((type) => (
                  <linearGradient key={type} id={`fill-${type}-${row.userId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${type})`} stopOpacity={0.7} />
                    <stop offset="95%" stopColor={`var(--color-${type})`} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} className="stroke-border" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} allowDecimals={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
              {ACTIVITY_TYPES.map((type) => (
                <Area
                  key={type}
                  dataKey={type}
                  type="monotone"
                  stackId="1"
                  fill={`url(#fill-${type}-${row.userId})`}
                  stroke={`var(--color-${type})`}
                  strokeWidth={1.5}
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No activities logged in this period.</p>
        )}
      </div>

      {/* Two-column lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListPanel
          title="Recent Activities"
          subtitle={`${drilldown.recentActivities.length} most recent`}
          empty="No activities in this period."
        >
          {drilldown.recentActivities.map((a) => {
            const Icon = ACTIVITY_ICONS[a.type];
            return (
              <li key={a.id} className="flex items-start gap-2.5 py-1.5 text-xs">
                <Icon size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium truncate">{a.subject || `(${ACTIVITY_LABELS[a.type]})`}</p>
                    <span className="text-muted-foreground text-[10px] shrink-0">
                      {new Date(a.occurredAt).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <Link
                    href={`/customers/${a.customerId}`}
                    className="text-muted-foreground hover:text-foreground hover:underline truncate inline-block max-w-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {a.customerName}
                  </Link>
                </div>
              </li>
            );
          })}
        </ListPanel>

        <ListPanel
          title="Open Opportunities"
          subtitle={drilldown.openOppsValue > 0 ? fmtEurExact(drilldown.openOppsValue) : '—'}
          empty="No open opportunities."
        >
          {drilldown.openOpps.map((o) => (
            <li key={o.id} className="flex items-start gap-2.5 py-1.5 text-xs">
              <Target size={13} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-medium truncate">{o.subject}</p>
                  <span className="font-semibold tabular-nums shrink-0">
                    {o.estimatedRevenue !== null ? fmtEur(o.estimatedRevenue) : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Link
                    href={`/customers/${o.customerId}`}
                    className="hover:text-foreground hover:underline truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {o.customerName}
                  </Link>
                  <span>·</span>
                  <span className="truncate">{o.stage}</span>
                  <span>·</span>
                  <span className="shrink-0">{o.probability}%</span>
                </div>
              </div>
            </li>
          ))}
        </ListPanel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ListPanel
          title="Overdue Follow-ups"
          subtitle={drilldown.overdueFollowups.length > 0 ? `${drilldown.overdueFollowups.length} overdue` : ''}
          empty="No overdue follow-ups."
        >
          {drilldown.overdueFollowups.map((f) => (
            <li key={f.id} className="flex items-start gap-2.5 py-1.5 text-xs">
              <AlertTriangle size={13} className="text-destructive mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-medium truncate">{f.title}</p>
                  <span className="text-destructive text-[10px] shrink-0 font-medium">
                    {f.daysOverdue}d late
                  </span>
                </div>
                <Link
                  href={`/customers/${f.customerId}`}
                  className="text-muted-foreground hover:text-foreground hover:underline truncate inline-block max-w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  {f.customerName}
                </Link>
              </div>
            </li>
          ))}
        </ListPanel>

        <ListPanel
          title="Stale Customers"
          subtitle="Owned, no activity in 60+ days"
          empty="All owned customers have recent activity."
        >
          {drilldown.staleCustomers.map((c) => (
            <li key={c.id} className="flex items-start gap-2.5 py-1.5 text-xs">
              <Users size={13} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <Link
                    href={`/customers/${c.id}`}
                    className="font-medium truncate hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.name}
                  </Link>
                  <span className="text-muted-foreground text-[10px] shrink-0">
                    {c.lastActivityAt ? `${c.daysSince}d` : 'never'}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  {c.lastActivityAt
                    ? `Last activity ${new Date(c.lastActivityAt).toLocaleDateString('nl-BE')}`
                    : 'No activity logged'}
                </p>
              </div>
            </li>
          ))}
        </ListPanel>
      </div>
    </div>
  );
}

function ListPanel({
  title, subtitle, children, empty,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  empty: string;
}) {
  const items = Array.isArray(children) ? children : [children];
  const isEmpty = items.length === 0 || (items.length === 1 && !items[0]);
  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/20">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      {isEmpty ? (
        <p className="px-4 py-6 text-xs text-muted-foreground text-center">{empty}</p>
      ) : (
        <ul className="px-3 py-2 divide-y divide-border/30 max-h-[260px] overflow-y-auto">
          {children}
        </ul>
      )}
    </div>
  );
}
