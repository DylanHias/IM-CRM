'use client';

import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomerStore } from '@/store/customerStore';
import { useEffect, useState } from 'react';
import { queryUniqueOwners } from '@/lib/db/queries/customers';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { mockCustomers } from '@/lib/mock/customers';

export function CustomerFilters() {
  const {
    searchQuery, filterOwnerId, filterNoRecentActivity,
    setSearchQuery, setFilterOwnerId, toggleNoRecentActivityFilter,
    customers,
  } = useCustomerStore();
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      if (isTauriApp()) {
        const data = await queryUniqueOwners();
        setOwners(data);
      } else {
        const unique = new Map<string, string>();
        mockCustomers.forEach((c) => {
          if (c.ownerId && c.ownerName) unique.set(c.ownerId, c.ownerName);
        });
        setOwners(Array.from(unique.entries()).map(([id, name]) => ({ id, name })));
      }
    };
    load();
  }, [customers]);

  const hasFilters = !!filterOwnerId || filterNoRecentActivity;

  const clearFilters = () => {
    setFilterOwnerId(null);
    if (filterNoRecentActivity) toggleNoRecentActivityFilter();
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-[360px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9"
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

      <Select
        value={filterOwnerId ?? 'all'}
        onValueChange={(v) => setFilterOwnerId(v === 'all' ? null : v)}
      >
        <SelectTrigger className="h-9 w-[180px]">
          <SelectValue placeholder="All owners" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All owners</SelectItem>
          {owners.map((o) => (
            <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant={filterNoRecentActivity ? 'default' : 'outline'}
        size="sm"
        className="h-9 gap-1.5"
        onClick={toggleNoRecentActivityFilter}
      >
        <Filter size={13} />
        No recent activity
      </Button>

      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
          <X size={13} className="mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
