'use client';

import { useEffect, useState } from 'react';
import { useAdminStore } from '@/store/adminStore';
import { useAuthStore } from '@/store/authStore';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { insertAuditLog } from '@/lib/db/queries/auditLog';
import { fetchD365AuditLog } from '@/lib/sync/d365AuditAdapter';
import type { AuditEntityType, AuditAction } from '@/types/admin';

const ENTITY_TYPES: AuditEntityType[] = ['customer', 'contact', 'activity', 'follow_up', 'opportunity'];
const ACTIONS: AuditAction[] = ['create', 'update', 'delete'];

const ACTION_COLORS: Record<AuditAction, string> = {
  create: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function AuditLog() {
  const {
    auditEntries, auditTotalCount, auditFilters,
    isLoading, loadAuditLog, setAuditFilters,
  } = useAdminStore();
  const accessToken = useAuthStore((s) => s.accessToken);
  const users = useAdminStore((s) => s.users);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadAuditLog();
  }, [loadAuditLog, auditFilters]);

  const handleRefreshFromD365 = async () => {
    if (!accessToken) return;
    setRefreshing(true);
    try {
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

  const totalPages = Math.ceil(auditTotalCount / auditFilters.limit);
  const currentPage = Math.floor(auditFilters.offset / auditFilters.limit) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Audit Log</h2>
        <Button variant="outline" size="sm" onClick={handleRefreshFromD365} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span className="ml-1.5">Refresh from D365</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={auditFilters.entityType ?? ''}
          onChange={(e) => setAuditFilters({ entityType: (e.target.value || undefined) as AuditEntityType | undefined, offset: 0 })}
          className="h-8 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">All entity types</option>
          {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          value={auditFilters.action ?? ''}
          onChange={(e) => setAuditFilters({ action: (e.target.value || undefined) as AuditAction | undefined, offset: 0 })}
          className="h-8 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">All actions</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        <select
          value={auditFilters.changedById ?? ''}
          onChange={(e) => setAuditFilters({ changedById: e.target.value || undefined, offset: 0 })}
          className="h-8 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">All users</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>

        <input
          type="date"
          value={auditFilters.dateFrom ?? ''}
          onChange={(e) => setAuditFilters({ dateFrom: e.target.value || undefined, offset: 0 })}
          className="h-8 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <input
          type="date"
          value={auditFilters.dateTo ?? ''}
          onChange={(e) => setAuditFilters({ dateTo: e.target.value || undefined, offset: 0 })}
          className="h-8 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-muted/30">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Timestamp</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">User</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Entity</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Entity ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {auditEntries.map((entry) => (
                <>
                  <tr
                    key={entry.id}
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
                    <tr key={`${entry.id}-detail`}>
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
                </>
              ))}
              {auditEntries.length === 0 && (
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
