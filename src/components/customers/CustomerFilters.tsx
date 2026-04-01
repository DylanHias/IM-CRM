'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useShortcutListener } from '@/hooks/useShortcuts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomerStore } from '@/store/customerStore';
import { useSettingsStore } from '@/store/settingsStore';
import type { SortBy } from '@/store/customerStore';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'lastActivity', label: 'Last Activity' },
  { value: 'name', label: 'Name' },
  { value: 'city', label: 'City' },
  { value: 'industry', label: 'Industry' },
];

export function CustomerFilters() {
  const {
    customers,
    searchQuery, sortBy, sortDir,
    filterOwnerId, filterStatus, filterIndustry, filterSegment, filterCountry, filterNoRecentActivity,
    setSearchQuery, setSortBy, setSortDir,
    setFilterOwnerId, setFilterStatus, setFilterIndustry, setFilterSegment, setFilterCountry,
    toggleNoRecentActivityFilter, clearFilters, getActiveFilterCount,
  } = useCustomerStore();

  const noRecentActivityDays = useSettingsStore((s) => s.noRecentActivityDays);
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount = getActiveFilterCount();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useShortcutListener('focus-search', useCallback(() => searchInputRef.current?.focus(), []));
  useShortcutListener('toggle-filters', useCallback(() => setShowFilters((v) => !v), []));

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => { if (c.ownerId && c.ownerName) map.set(c.ownerId, c.ownerName); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [customers]);

  const industries = useMemo(() =>
    Array.from(new Set(customers.map((c) => c.industry).filter(Boolean) as string[])).sort(),
    [customers]);

  const segments = useMemo(() =>
    Array.from(new Set(customers.map((c) => c.segment).filter(Boolean) as string[])).sort(),
    [customers]);

  const countries = useMemo(() =>
    Array.from(new Set(customers.map((c) => c.addressCountry).filter(Boolean) as string[])).sort(),
    [customers]);

  const toggleSortDir = () => setSortDir(sortDir === 'asc' ? 'desc' : 'asc');

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Sort + Filter toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <Input
            ref={searchInputRef}
            placeholder="Search customers..."
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
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="h-9 w-[148px] gap-1">
              <ArrowUpDown size={13} className="text-muted-foreground flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={toggleSortDir} title={sortDir === 'asc' ? 'Ascending' : 'Descending'}>
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

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-card border border-border/70 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 shadow-sm">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | 'active' | 'inactive')}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {owners.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Owner</label>
              <Select value={filterOwnerId ?? 'all'} onValueChange={(v) => setFilterOwnerId(v === 'all' ? null : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All owners" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {owners.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {industries.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Industry</label>
              <Select value={filterIndustry ?? 'all'} onValueChange={(v) => setFilterIndustry(v === 'all' ? null : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All industries" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All industries</SelectItem>
                  {industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {segments.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Segment</label>
              <Select value={filterSegment ?? 'all'} onValueChange={(v) => setFilterSegment(v === 'all' ? null : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All segments" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All segments</SelectItem>
                  {segments.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {countries.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Country</label>
              <Select value={filterCountry ?? 'all'} onValueChange={(v) => setFilterCountry(v === 'all' ? null : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All countries" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1 flex flex-col">
            <label className="text-xs font-medium text-muted-foreground">Activity</label>
            <Button
              variant={filterNoRecentActivity ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs justify-start"
              onClick={toggleNoRecentActivityFilter}
            >
              No activity ({noRecentActivityDays}d+)
            </Button>
          </div>
        </div>
      )}

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterStatus !== 'all' && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setFilterStatus('all')}>
              {filterStatus} <X size={10} />
            </Badge>
          )}
          {filterOwnerId && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setFilterOwnerId(null)}>
              {owners.find((o) => o.id === filterOwnerId)?.name ?? 'Owner'} <X size={10} />
            </Badge>
          )}
          {filterIndustry && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setFilterIndustry(null)}>
              {filterIndustry} <X size={10} />
            </Badge>
          )}
          {filterSegment && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setFilterSegment(null)}>
              {filterSegment} <X size={10} />
            </Badge>
          )}
          {filterCountry && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setFilterCountry(null)}>
              {filterCountry} <X size={10} />
            </Badge>
          )}
          {filterNoRecentActivity && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={toggleNoRecentActivityFilter}>
              No recent activity <X size={10} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
