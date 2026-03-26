'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { RefreshCw, Search, X, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useShortcutListener } from '@/hooks/useShortcuts';
import type { UserRole } from '@/types/admin';

type SortField = 'name' | 'email' | 'businessUnit' | 'lastActiveAt' | 'role';

export function UserManagement() {
  const { users, isLoading, loadUsers, refreshUsersFromD365, updateUserRole } = useAdminStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [filterBU, setFilterBU] = useState('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useShortcutListener('focus-search', useCallback(() => searchInputRef.current?.focus(), []));
  useShortcutListener('toggle-filters', useCallback(() => setShowFilters((v) => !v), []));

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const buOptions = useMemo(() => {
    const bus = new Set(users.map((u) => u.businessUnit).filter(Boolean) as string[]);
    return Array.from(bus).sort();
  }, [users]);

  const activeFilterCount = (filterRole !== 'all' ? 1 : 0) + (filterBU !== 'all' ? 1 : 0);

  function clearFilters() {
    setFilterRole('all');
    setFilterBU('all');
  }

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const rows = users.filter((u) => {
      if (q && !(
        u.name.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q) ||
        (u.businessUnit ?? '').toLowerCase().includes(q)
      )) return false;
      if (filterRole !== 'all' && u.role !== filterRole) return false;
      if (filterBU !== 'all' && u.businessUnit !== filterBU) return false;
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
        case 'businessUnit':
          cmp = (a.businessUnit ?? '').localeCompare(b.businessUnit ?? '');
          break;
        case 'role':
          cmp = a.role.localeCompare(b.role);
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
  }, [users, searchQuery, sortBy, sortDir, filterRole, filterBU]);

  function toggleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'lastActiveAt' ? 'desc' : 'asc');
    }
  }

  const handleRoleChange = async (userId: string, role: UserRole) => {
    setChangingRole(userId);
    try {
      await updateUserRole(userId, role);
    } finally {
      setChangingRole(null);
    }
  };

  const handleRefresh = async () => {
    if (!accessToken) return;
    await refreshUsersFromD365(accessToken);
  };

  const columns = [
    { field: 'name' as SortField, label: 'Name', align: 'text-left' },
    { field: 'email' as SortField, label: 'Email', align: 'text-left' },
    { field: 'businessUnit' as SortField, label: 'Business Unit', align: 'text-left' },
    { field: 'lastActiveAt' as SortField, label: 'Last Active', align: 'text-left' },
    { field: 'role' as SortField, label: 'Role', align: 'text-left' },
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

      {/* Search + Sort + Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <Input
            ref={searchInputRef}
            placeholder="Search name, email or business unit…"
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
              <SelectItem value="businessUnit">Business Unit</SelectItem>
              <SelectItem value="lastActiveAt">Last Active</SelectItem>
              <SelectItem value="role">Role</SelectItem>
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
        <div className="bg-card border border-border/70 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 shadow-sm">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Role</label>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Business Unit</label>
            <Select value={filterBU} onValueChange={setFilterBU}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All units</SelectItem>
                {buOptions.map((bu) => (
                  <SelectItem key={bu} value={bu}>{bu}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Active filter badges */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterRole !== 'all' && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setFilterRole('all')}>
              {filterRole} <X size={10} />
            </Badge>
          )}
          {filterBU !== 'all' && (
            <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary" onClick={() => setFilterBU('all')}>
              {filterBU} <X size={10} />
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
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.businessUnit || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      disabled={changingRole === user.id}
                      className="h-7 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
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
