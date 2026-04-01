'use client';

import { Fragment, useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import {
  RefreshCw, ChevronLeft, ChevronRight, Search, X,
  ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { useShortcutListener } from '@/hooks/useShortcuts';
import type { AuditEntityType, AuditAction, AuditLogEntry } from '@/types/admin';

const ENTITY_TYPES: AuditEntityType[] = ['customer', 'contact', 'activity', 'follow_up', 'opportunity'];
const ACTIONS: AuditAction[] = ['create', 'update', 'delete'];

const ACTION_COLORS: Record<AuditAction, string> = {
  create: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

type SortField = 'changedAt' | 'changedByName' | 'action' | 'entityType' | 'entityId';

export function AuditLog() {
  const {
    auditEntries, auditTotalCount, auditFilters,
    isLoading, loadAuditLog, setAuditFilters,
  } = useAdminStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const users = useAdminStore((s) => s.users);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('changedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useShortcutListener('focus-search', useCallback(() => searchInputRef.current?.focus(), []));
  useShortcutListener('toggle-filters', useCallback(() => setShowFilters((v) => !v), []));

  useEffect(() => {
    loadAuditLog();
  }, [loadAuditLog, auditFilters]);

  const handleRefreshFromD365 = async () => {
    if (!accessToken || !isTauriApp()) return;
    setRefreshing(true);
    try {
      const { fetchD365AuditLog } = await import('@/lib/sync/d365AuditAdapter');
      const { insertAuditLog } = await import('@/lib/db/queries/auditLog');
      const entries = await fetchD365AuditLog(accessToken, {
        dateFrom: auditFilters.dateFrom,
        dateTo: auditFilters.dateTo,
      });
      for (const entry of entries) {
        await insertAuditLog(entry);
      }
      await loadAuditLog();
    } finally {
      setRefreshing(false);
    }
  };

  const activeFilterCount =
    (auditFilters.entityType ? 1 : 0) +
    (auditFilters.action ? 1 : 0) +
    (auditFilters.changedById ? 1 : 0) +
    (auditFilters.dateFrom ? 1 : 0) +
    (auditFilters.dateTo ? 1 : 0);

  function clearFilters() {
    setAuditFilters({
      entityType: undefined,
      action: undefined,
      changedById: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      offset: 0,
    });
  }

  // Client-side search + sort on already-filtered entries from store
  const displayed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows: AuditLogEntry[] = auditEntries;

    if (q) {
      rows = rows.filter((e) =>
        e.changedByName.toLowerCase().includes(q) ||
        e.entityType.toLowerCase().includes(q) ||
        e.entityId.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        JSON.stringify(e.oldValues ?? '').toLowerCase().includes(q) ||
        JSON.stringify(e.newValues ?? '').toLowerCase().includes(q)
      );
    }

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'changedAt':
          cmp = a.changedAt.localeCompare(b.changedAt);
          break;
        case 'changedByName':
          cmp = a.changedByName.localeCompare(b.changedByName);
          break;
        case 'action':
          cmp = a.action.localeCompare(b.action);
          break;
        case 'entityType':
          cmp = a.entityType.localeCompare(b.entityType);
          break;
        case 'entityId':
          cmp = a.entityId.localeCompare(b.entityId);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [auditEntries, searchQuery, sortBy, sortDir]);

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'changedAt' ? 'desc' : 'asc');
    }
  }

  const totalPages = Math.ceil(auditTotalCount / auditFilters.limit);
  const currentPage = Math.floor(auditFilters.offset / auditFilters.limit) + 1;

  const columns = [
    { field: 'changedAt' as SortField, label: 'Timestamp', align: 'text-left' },
    { field: 'changedByName' as SortField, label: 'User', align: 'text-left' },
    { field: 'action' as SortField, label: 'Action', align: 'text-left' },
    { field: 'entityType' as SortField, label: 'Entity', align: 'text-left' },
    { field: 'entityId' as SortField, label: 'Entity ID', align: 'text-left' },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Audit Log</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {auditTotalCount} entr{auditTotalCount !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshFromD365} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span className="ml-1.5">Refresh from D365</span>
        </Button>
      </div>

      {/* Search + Sort + Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <Input
            ref={searchInputRef}
            placeholder="Search user, entity, action or values…"
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

        <div className="flex items-center gap-1">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
            <SelectTrigger className="h-9 w-[148px] gap-1">
              <ArrowUpDown size={13} className="text-muted-foreground flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="changedAt">Timestamp</SelectItem>
              <SelectItem value="changedByName">User</SelectItem>
              <SelectItem value="action">Action</SelectItem>
              <SelectItem value="entityType">Entity</SelectItem>
              <SelectItem value="entityId">Entity ID</SelectItem>
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

        <Button
          variant={showFilters || activeFilterCount > 0 ? 'default' : 'outline'}
          size="sm"
          className="h-9 gap-1.5"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal size={13} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 bg-primary-foreground text-primary text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
            <X size={13} className="mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-card border border-border/70 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 shadow-sm">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Entity Type</label>
            <Select
              value={auditFilters.entityType ?? 'all'}
              onValueChange={(v) => setAuditFilters({ entityType: (v === 'all' ? undefined : v) as AuditEntityType | undefined, offset: 0 })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entity types</SelectItem>
                {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Action</label>
            <Select
              value={auditFilters.action ?? 'all'}
              onValueChange={(v) => setAuditFilters({ action: (v === 'all' ? undefined : v) as AuditAction | undefined, offset: 0 })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">User</label>
            <Select
              value={auditFilters.changedById ?? 'all'}
              onValueChange={(v) => setAuditFilters({ changedById: v === 'all' ? undefined : v, offset: 0 })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date from</label>
            <Input
              type="date"
              value={auditFilters.dateFrom ?? ''}
              onChange={(e) => setAuditFilters({ dateFrom: e.target.value || undefined, offset: 0 })}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date to</label>
            <Input
              type="date"
              value={auditFilters.dateTo ?? ''}
              onChange={(e) => setAuditFilters({ dateTo: e.target.value || undefined, offset: 0 })}
              className="h-8 text-xs"
            />
          </div>
        </div>
      )}

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {auditFilters.entityType && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setAuditFilters({ entityType: undefined, offset: 0 })}>
              {auditFilters.entityType} <X size={10} />
            </Badge>
          )}
          {auditFilters.action && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setAuditFilters({ action: undefined, offset: 0 })}>
              {auditFilters.action} <X size={10} />
            </Badge>
          )}
          {auditFilters.changedById && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setAuditFilters({ changedById: undefined, offset: 0 })}>
              {users.find((u) => u.id === auditFilters.changedById)?.name ?? auditFilters.changedById} <X size={10} />
            </Badge>
          )}
          {auditFilters.dateFrom && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setAuditFilters({ dateFrom: undefined, offset: 0 })}>
              From: {auditFilters.dateFrom} <X size={10} />
            </Badge>
          )}
          {auditFilters.dateTo && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setAuditFilters({ dateTo: undefined, offset: 0 })}>
              To: {auditFilters.dateTo} <X size={10} />
            </Badge>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30">
                {columns.map(({ field, label, align }) => (
                  <th
                    key={field}
                    className={cn(
                      align, 'px-4 py-2.5 font-semibold text-muted-foreground whitespace-nowrap',
                      'cursor-pointer select-none hover:text-foreground transition-colors'
                    )}
                    onClick={() => toggleSort(field)}
                  >
                    <span className="inline-flex items-center gap-1">
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
              {displayed.map((entry) => (
                <Fragment key={entry.id}>
                  <tr
                    className="hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(entry.changedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium">{entry.changedByName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${ACTION_COLORS[entry.action]}`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">{entry.entityType}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {entry.entityId.slice(0, 8)}...
                    </td>
                  </tr>
                  {expandedId === entry.id && (entry.oldValues || entry.newValues) && (
                    <tr>
                      <td colSpan={5} className="bg-muted/10 px-4 py-3">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {entry.oldValues && (
                            <div>
                              <p className="mb-1 font-medium text-muted-foreground">Old Values</p>
                              <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3">{JSON.stringify(entry.oldValues, null, 2)}</pre>
                            </div>
                          )}
                          {entry.newValues && (
                            <div>
                              <p className="mb-1 font-medium text-muted-foreground">New Values</p>
                              <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3">{JSON.stringify(entry.newValues, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {isLoading ? 'Loading...' : 'No audit entries found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {auditTotalCount} entr{auditTotalCount !== 1 ? 'ies' : 'y'} · Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setAuditFilters({ offset: auditFilters.offset - auditFilters.limit })}
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setAuditFilters({ offset: auditFilters.offset + auditFilters.limit })}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
