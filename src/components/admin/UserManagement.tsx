'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { RefreshCw, Search, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useShortcutListener } from '@/hooks/useShortcuts';

type SortField = 'name' | 'email' | 'title' | 'lastActiveAt';

export function UserManagement() {
  const { users, isLoading, loadUsers, refreshUsersFromD365 } = useAdminStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
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
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [users, searchQuery, sortBy, sortDir]);

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'lastActiveAt' ? 'desc' : 'asc');
    }
  }

  const handleRefresh = async () => {
    if (!accessToken) return;
    try {
      await refreshUsersFromD365(accessToken);
    } catch (err) {
      console.error('[admin] Refresh users from D365 failed:', err);
    }
  };

  const columns = [
    { field: 'name' as SortField, label: 'Name', align: 'text-left' },
    { field: 'email' as SortField, label: 'Email', align: 'text-left' },
    { field: 'title' as SortField, label: 'Title', align: 'text-left' },
    { field: 'lastActiveAt' as SortField, label: 'Last Accessed', align: 'text-left' },
  ] as const;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Users</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} user{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          <span className="ml-1.5">Refresh from D365</span>
        </Button>
      </div>

      {/* Search + Sort */}
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
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.title || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {isLoading ? 'Loading...' : 'No users found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
