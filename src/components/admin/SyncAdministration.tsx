'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { RefreshCw, Trash2, Search, X, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { runFullSync, resetSyncWatermark } from '@/lib/sync/syncService';
import { isTauriApp } from '@/lib/utils/offlineUtils';

type SortField = 'syncType' | 'errorMessage' | 'createdAt';

export function SyncAdministration() {
  const { syncHealth, syncErrors, isLoading, loadSyncAdmin } = useAdminStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [syncing, setSyncing] = useState(false);
  const [purgeDays, setPurgeDays] = useState(90);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadSyncAdmin();
  }, [loadSyncAdmin]);

  const typeOptions = useMemo(() => {
    const types = new Set(syncErrors.map((e) => e.syncType));
    return Array.from(types).sort();
  }, [syncErrors]);

  const activeFilterCount = filterType !== 'all' ? 1 : 0;

  const displayed = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let rows = syncErrors.filter((e) => {
      if (q && !(
        e.syncType.toLowerCase().includes(q) ||
        (e.errorMessage ?? '').toLowerCase().includes(q)
      )) return false;
      if (filterType !== 'all' && e.syncType !== filterType) return false;
      return true;
    });

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'syncType':
          cmp = a.syncType.localeCompare(b.syncType);
          break;
        case 'errorMessage':
          cmp = (a.errorMessage ?? '').localeCompare(b.errorMessage ?? '');
          break;
        case 'createdAt':
          cmp = a.createdAt.localeCompare(b.createdAt);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [syncErrors, searchQuery, sortBy, sortDir, filterType]);

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'createdAt' ? 'desc' : 'asc');
    }
  }

  const handleForceSync = async () => {
    if (!accessToken || !isTauriApp()) return;
    setSyncing(true);
    try {
      await resetSyncWatermark();
      await runFullSync(accessToken);
      await loadSyncAdmin();
    } catch (err) {
      console.error('[sync] Force re-sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handlePurge = async () => {
    if (!isTauriApp()) return;
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - purgeDays);
      const { purgeSyncRecordsBefore } = await import('@/lib/db/queries/adminAnalytics');
      const deleted = await purgeSyncRecordsBefore(cutoff.toISOString());
      alert(`Purged ${deleted} sync records.`);
      await loadSyncAdmin();
    } catch (err) {
      console.error('[sync] Purge sync records failed:', err);
    }
  };

  const metrics = [
    { label: 'Total Syncs', value: syncHealth?.totalSyncs ?? 0 },
    { label: 'Success Rate', value: `${(syncHealth?.successRate ?? 0).toFixed(1)}%` },
    { label: 'Avg Duration', value: `${((syncHealth?.avgDurationMs ?? 0) / 1000).toFixed(1)}s` },
    { label: 'Records Processed', value: syncHealth?.totalRecordsProcessed ?? 0 },
  ];

  const columns = [
    { field: 'syncType' as SortField, label: 'Type', align: 'text-left' },
    { field: 'errorMessage' as SortField, label: 'Error', align: 'text-left' },
    { field: 'createdAt' as SortField, label: 'Date', align: 'text-left' },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Sync Administration</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleForceSync} disabled={syncing || isLoading}>
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span className="ml-1.5">Force Re-sync</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* Error List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Errors</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {displayed.length} error{displayed.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Search + Sort + Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              placeholder="Search error messages…"
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
                <SelectItem value="createdAt">Date</SelectItem>
                <SelectItem value="syncType">Type</SelectItem>
                <SelectItem value="errorMessage">Error</SelectItem>
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
            <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={() => setFilterType('all')}>
              <X size={13} className="mr-1" />
              Clear all
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-card border border-border/70 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 shadow-sm">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sync Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {typeOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Active filter badges */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {filterType !== 'all' && (
              <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setFilterType('all')}>
                {filterType} <X size={10} />
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
                {displayed.map((err) => (
                  <tr key={err.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">{err.syncType}</td>
                    <td className="px-4 py-3 text-destructive">{err.errorMessage}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(err.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
                {displayed.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">No errors</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Purge */}
      <div className="flex items-center gap-3">
        <Trash2 size={14} className="text-muted-foreground" />
        <span className="text-sm">Purge sync records older than</span>
        <input
          type="number"
          value={purgeDays}
          onChange={(e) => setPurgeDays(Number(e.target.value))}
          className="w-16 h-8 rounded-md border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          min={1}
        />
        <span className="text-sm">days</span>
        <Button variant="outline" size="sm" onClick={handlePurge}>Purge</Button>
      </div>
    </div>
  );
}
