'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
import { Search, X, SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useShortcutListener } from '@/hooks/useShortcuts';
import { useOpportunityListStore } from '@/store/opportunityListStore';
import type { OppSortBy } from '@/store/opportunityListStore';

const SORT_OPTIONS: { value: OppSortBy; label: string }[] = [
  { value: 'createdAt', label: 'Created' },
  { value: 'subject', label: 'Subject' },
  { value: 'estimatedRevenue', label: 'Revenue' },
  { value: 'expirationDate', label: 'Expiration' },
  { value: 'stage', label: 'Stage' },
];

const STAGE_ORDER = [
  'Prospecting',
  'Validated',
  'Qualified',
  'Verbal Received',
  'Contract Received',
  'Billing Rejection',
  'Pending Vendor Confirmation',
  'Purchased',
];

export function OpportunitiesFilters() {
  const {
    opportunities, customerMap,
    searchQuery, sortBy, sortDir,
    filterCustomerId, filterStage,
    setSearchQuery, setSortBy, setSortDir,
    setFilterCustomerId, setFilterStage,
    clearFilters, getActiveFilterCount,
  } = useOpportunityListStore();

  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount = getActiveFilterCount();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useShortcutListener('focus-search', useCallback(() => searchInputRef.current?.focus(), []));
  useShortcutListener('toggle-filters', useCallback(() => setShowFilters((v) => !v), []));

  const companies = useMemo(() => {
    const ids = new Set(opportunities.map((o) => o.customerId));
    return Array.from(ids)
      .map((id) => ({ id, name: customerMap.get(id) ?? id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [opportunities, customerMap]);

  const stages = useMemo(() => {
    const present = new Set(opportunities.map((o) => o.stage));
    return STAGE_ORDER.filter((s) => present.has(s)).concat(
      Array.from(present).filter((s) => !STAGE_ORDER.includes(s)).sort(),
    );
  }, [opportunities]);

  const toggleSortDir = () => setSortDir(sortDir === 'asc' ? 'desc' : 'asc');

  const selectedCompanyName = filterCustomerId ? customerMap.get(filterCustomerId) : null;

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Sort + Filter toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <Input
            ref={searchInputRef}
            placeholder="Search by subject, company, or vendor..."
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
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as OppSortBy)}>
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
        <div className="bg-card border border-border/70 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-3 shadow-sm">
          {companies.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Company</label>
              <Select value={filterCustomerId ?? 'all'} onValueChange={(v) => setFilterCustomerId(v === 'all' ? null : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All companies" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All companies</SelectItem>
                  {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {stages.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Stage</label>
              <Select value={filterStage ?? 'all'} onValueChange={(v) => setFilterStage(v === 'all' ? null : v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All stages" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stages</SelectItem>
                  {stages.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterCustomerId && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setFilterCustomerId(null)}>
              {selectedCompanyName ?? 'Company'} <X size={10} />
            </Badge>
          )}
          {filterStage && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setFilterStage(null)}>
              {filterStage} <X size={10} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
