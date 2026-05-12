'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { d365Request } from '@/lib/auth/msalConfig';
import { RefreshCw, Search, X, ArrowUpDown, ArrowUp, ArrowDown, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TableRowsSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useShortcutListener } from '@/hooks/useShortcuts';

type SortField = 'name' | 'email' | 'title' | 'lastActiveAt' | 'analyticsTracked';
type TrackedFilter = 'all' | 'tracked' | 'untracked';

export function UserManagement() {
  const {
    users, isLoading, loadUsers, refreshUsersFromD365,
    setUserAnalyticsTracked, bulkSetAnalyticsTracked,
  } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [trackedFilter, setTrackedFilter] = useState<TrackedFilter>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useShortcutListener('focus-search', useCallback(() => searchInputRef.current?.focus(), []));

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const rows = users.filter((u) => {
      if (q && !(
        u.name.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.title ?? '').toLowerCase().includes(q)
      )) return false;
      if (trackedFilter === 'tracked' && !u.analyticsTracked) return false;
      if (trackedFilter === 'untracked' && u.analyticsTracked) return false;
      return true;
    });

    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'email':
          cmp = (a.email ?? '').localeCompare(b.email ?? '');
          break;
        case 'title':
          cmp = (a.title ?? '').localeCompare(b.title ?? '');
          break;
        case 'lastActiveAt': {
          const aDate = a.lastActiveAt ?? '';
          const bDate = b.lastActiveAt ?? '';
          cmp = aDate.localeCompare(bDate);
          break;
        }
        case 'analyticsTracked':
          cmp = Number(a.analyticsTracked) - Number(b.analyticsTracked);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [users, searchQuery, sortBy, sortDir, trackedFilter]);

  const trackedCount = useMemo(() => users.filter((u) => u.analyticsTracked).length, [users]);
  const allVisibleTracked = filtered.length > 0 && filtered.every((u) => u.analyticsTracked);
  const noneVisibleTracked = filtered.every((u) => !u.analyticsTracked);

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'lastActiveAt' || field === 'analyticsTracked' ? 'desc' : 'asc');
    }
  }

  const handleRefresh = async () => {
    try {
      const token = await getAccessToken(d365Request.scopes);
      if (!token) return;
      await refreshUsersFromD365(token);
    } catch (err) {
      console.error('[admin] Refresh users from D365 failed:', err);
    }
  };

  const handleTrackVisible = async (tracked: boolean) => {
    const ids = filtered.filter((u) => u.analyticsTracked !== tracked).map((u) => u.id);
    if (ids.length === 0) return;
    await bulkSetAnalyticsTracked(ids, tracked);
  };

  const columns: { field: SortField; label: string; align: string; width?: string }[] = [
    { field: 'name', label: 'Name', align: 'text-left' },
    { field: 'email', label: 'Email', align: 'text-left' },
    { field: 'title', label: 'Title', align: 'text-left' },
    { field: 'lastActiveAt', label: 'Last Accessed', align: 'text-left' },
    { field: 'analyticsTracked', label: 'In Analytics', align: 'text-center', width: 'w-[140px]' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Users</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} user{filtered.length !== 1 ? 's' : ''}
            <span className="mx-1.5 text-border">·</span>
            <span className="inline-flex items-center gap-1">
              <BarChart3 size={11} className="text-primary/80" />
              {trackedCount} tracked in analytics
            </span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span className="ml-1.5">Refresh from D365</span>
        </Button>
      </div>

      {/* Search + Sort + Tracked filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <Input
            ref={searchInputRef}
            placeholder="Search name, email or title…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 pr-8 bg-card shadow-sm border-border/70 rounded-lg"
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <Select value={trackedFilter} onValueChange={(v) => setTrackedFilter(v as TrackedFilter)}>
          <SelectTrigger className="h-9 w-[150px] gap-1">
            <BarChart3 size={13} className="text-muted-foreground flex-shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            <SelectItem value="tracked">Tracked only</SelectItem>
            <SelectItem value="untracked">Untracked only</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
            <SelectTrigger className="h-9 w-[148px] gap-1">
              <ArrowUpDown size={13} className="text-muted-foreground flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="lastActiveAt">Last Accessed</SelectItem>
              <SelectItem value="analyticsTracked">In Analytics</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          </Button>
        </div>
      </div>

      {/* Bulk-action bar — shown when there are visible users */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Bulk action for the <span className="font-medium text-foreground">{filtered.length}</span> visible user{filtered.length !== 1 ? 's' : ''}:
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={allVisibleTracked}
              onClick={() => handleTrackVisible(true)}
            >
              Track all
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={noneVisibleTracked}
              onClick={() => handleTrackVisible(false)}
            >
              Untrack all
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30">
                {columns.map(({ field, label, align, width }) => (
                  <th
                    key={field}
                    className={cn(
                      align, width, 'px-4 py-2.5 font-semibold text-muted-foreground whitespace-nowrap',
                      'cursor-pointer select-none hover:text-foreground transition-colors'
                    )}
                    onClick={() => toggleSort(field)}
                  >
                    <span className={cn('inline-flex items-center gap-1', align === 'text-center' && 'justify-center w-full')}>
                      {label}
                      {sortBy === field && (
                        sortDir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading && filtered.length === 0 ? (
                <TableRowsSkeleton rows={6} cols={columns.length} />
              ) : (
                <>
                  <TooltipProvider delayDuration={200}>
                    {filtered.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.email || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{user.title || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Switch
                                  checked={user.analyticsTracked}
                                  onCheckedChange={(v) => setUserAnalyticsTracked(user.id, v)}
                                  aria-label={`Toggle analytics tracking for ${user.name}`}
                                />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="text-xs max-w-[220px]">
                              {user.analyticsTracked
                                ? `${user.name} appears in the team analytics leaderboard.`
                                : `Toggle on to include ${user.name} in the team analytics leaderboard.`}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </TooltipProvider>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
