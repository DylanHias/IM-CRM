'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Building2, User, Target, Clock, CheckSquare } from 'lucide-react';
import { useCustomerStore } from '@/store/customerStore';
import { useOpportunityListStore } from '@/store/opportunityListStore';
import { cn } from '@/lib/utils';
import { searchAll, type SearchResult, type SearchCategory } from '@/lib/today/search';
import type { Activity, FollowUp } from '@/types/entities';

const CATEGORY_META: Record<SearchCategory, { label: string; icon: typeof Search }> = {
  customer: { label: 'Customers', icon: Building2 },
  contact: { label: 'Contacts', icon: User },
  opportunity: { label: 'Opportunities', icon: Target },
  activity: { label: 'Activities', icon: Clock },
  followup: { label: 'Follow-Ups', icon: CheckSquare },
};

const CATEGORY_ORDER: SearchCategory[] = ['customer', 'contact', 'opportunity', 'activity', 'followup'];

interface Props {
  activities: Activity[];
  followUps: FollowUp[];
}

export function GlobalSearchBar({ activities, followUps }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const customers = useCustomerStore((s) => s.customers);
  const allContacts = useCustomerStore((s) => s.allContacts);
  const opportunities = useOpportunityListStore((s) => s.opportunities);
  const customerMap = useOpportunityListStore((s) => s.customerMap);

  const customerName = useCallback(
    (id: string) => customerMap.get(id) ?? customers.find((c) => c.id === id)?.name ?? '',
    [customerMap, customers]
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 120);
    return () => clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return null;
    return searchAll(debouncedQuery, {
      customers,
      contacts: allContacts,
      opportunities,
      activities,
      followUps,
      customerName,
    });
  }, [debouncedQuery, customers, allContacts, opportunities, activities, followUps, customerName]);

  const flatResults: SearchResult[] = useMemo(() => {
    if (!results) return [];
    return CATEGORY_ORDER.flatMap((cat) => results[cat]);
  }, [results]);

  useEffect(() => { setActiveIdx(-1); }, [flatResults]);

  // Focus on / keypress
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigate = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    router.push(result.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || flatResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      navigate(flatResults[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
    }
  };

  const hasResults = flatResults.length > 0;
  const showEmpty = open && debouncedQuery.trim() && !hasResults;

  return (
    <div ref={containerRef} className="relative">
      <div className={cn(
        'flex items-center gap-2.5 h-10 px-3.5 rounded-xl border bg-background transition-shadow',
        open ? 'border-primary/40 shadow-sm ring-1 ring-primary/20' : 'border-border hover:border-border/80',
      )}>
        <Search size={15} className="text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search everything… (press / to focus)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => { if (query) setOpen(true); }}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus(); }}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {(open && debouncedQuery.trim()) && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-border bg-popover shadow-lg overflow-hidden">
          {hasResults && (
            <div className="max-h-[400px] overflow-y-auto py-1.5">
              {CATEGORY_ORDER.map((cat) => {
                const items = results?.[cat] ?? [];
                if (items.length === 0) return null;
                const { label, icon: Icon } = CATEGORY_META[cat];
                const catOffset = CATEGORY_ORDER.slice(0, CATEGORY_ORDER.indexOf(cat)).reduce(
                  (acc, c) => acc + (results?.[c]?.length ?? 0), 0
                );
                return (
                  <div key={cat}>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {label}
                    </p>
                    {items.map((r, i) => {
                      const flatIdx = catOffset + i;
                      return (
                        <button
                          key={r.id}
                          onClick={() => navigate(r)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors',
                            activeIdx === flatIdx
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-accent/60 hover:text-accent-foreground',
                          )}
                        >
                          <Icon size={13} className="text-muted-foreground shrink-0" />
                          <span className="flex-1 truncate font-medium">{r.primary}</span>
                          {r.secondary && (
                            <span className="text-xs text-muted-foreground truncate max-w-[180px]">{r.secondary}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
          {showEmpty && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No results for &ldquo;{debouncedQuery}&rdquo;</p>
          )}
        </div>
      )}
    </div>
  );
}
