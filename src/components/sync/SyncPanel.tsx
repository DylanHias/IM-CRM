'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Upload, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TablePagination } from '@/components/ui/TablePagination';
import { useSync } from '@/hooks/useSync';
import { useSyncStore } from '@/store/syncStore';
import { usePaginationPreference } from '@/hooks/usePaginationPreference';
import { formatDate, formatDateTime, formatRelative } from '@/lib/utils/dateUtils';
import type { SyncRecord } from '@/types/sync';
import type { PendingActivitySyncItem } from '@/lib/db/queries/activities';
import type { PendingFollowUpSyncItem } from '@/lib/db/queries/followups';

const STATUS_CONFIG = {
  running: { icon: RefreshCw, color: 'text-info', variant: 'info' as const, label: 'Running' },
  success: { icon: CheckCircle, color: 'text-success', variant: 'success' as const, label: 'Success' },
  partial: { icon: AlertTriangle, color: 'text-warning', variant: 'warning' as const, label: 'Partial' },
  error: { icon: XCircle, color: 'text-destructive', variant: 'destructive' as const, label: 'Error' },
};

const SYNC_TYPE_LABELS: Record<string, string> = {
  d365: 'Dynamics 365',
  push_activities: 'Push Activities',
  push_followups: 'Push Follow-Ups',
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  meeting: 'Meeting',
  visit: 'Visit',
  call: 'Call',
  note: 'Note',
};

interface SyncPanelProps {
  records: SyncRecord[];
  pendingActivities: PendingActivitySyncItem[];
  pendingFollowUps: PendingFollowUpSyncItem[];
}

export function SyncPanel({ records, pendingActivities, pendingFollowUps }: SyncPanelProps) {
  const {
    isSyncing, isOnline, lastD365SyncAt,
    pendingActivityCount, pendingFollowUpCount, triggerSync, triggerPushPending,
  } = useSync();

  const hasPending = pendingActivityCount > 0 || pendingFollowUpCount > 0;

  return (
    <div className="space-y-5">
      {/* Status overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">D365 Last Sync</p>
          <p className="text-sm font-medium mt-1">
            {lastD365SyncAt ? formatRelative(lastD365SyncAt) : 'Never'}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Pending Activities</p>
          <p className="text-xl font-bold mt-1 text-warning">{pendingActivityCount}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Pending Follow-Ups</p>
          <p className="text-xl font-bold mt-1 text-warning">{pendingFollowUpCount}</p>
        </div>
      </div>

      {/* Sync buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={triggerSync}
          disabled={isSyncing || !isOnline}
          className="gap-2"
        >
          <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Run Full Sync'}
        </Button>
        <Button
          variant="outline"
          onClick={triggerPushPending}
          disabled={isSyncing || !isOnline || !hasPending}
          className="gap-2"
        >
          <Upload size={15} />
          Sync Pending
        </Button>
        {!isOnline && (
          <p className="text-sm text-muted-foreground">
            You are offline. Connect to sync.
          </p>
        )}
      </div>

      {/* Pending queue */}
      {(pendingActivities.length > 0 || pendingFollowUps.length > 0) && (
        <PendingQueue activities={pendingActivities} followUps={pendingFollowUps} />
      )}

      {/* Sync history */}
      {records.length > 0 && (
        <SyncHistory records={records} />
      )}
    </div>
  );
}

function PendingQueue({
  activities,
  followUps,
}: {
  activities: PendingActivitySyncItem[];
  followUps: PendingFollowUpSyncItem[];
}) {
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [followUpsPage, setFollowUpsPage] = useState(1);
  const { pageSize: actPageSize, setPageSize: setActPageSize, pageSizeOptions } = usePaginationPreference('pendingActivities');
  const { pageSize: fuPageSize, setPageSize: setFuPageSize } = usePaginationPreference('pendingFollowUps');

  const pagedActivities = activities.slice((activitiesPage - 1) * actPageSize, activitiesPage * actPageSize);
  const pagedFollowUps = followUps.slice((followUpsPage - 1) * fuPageSize, followUpsPage * fuPageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock size={15} className="text-warning" />
        <h3 className="text-sm font-semibold text-foreground">Pending Sync</h3>
      </div>

      {activities.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Activities ({activities.length})</p>
          <div className="bg-card border rounded-lg divide-y">
            {pagedActivities.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">
                      {ACTIVITY_TYPE_LABELS[item.type] ?? item.type}
                    </Badge>
                    <span className="text-sm font-medium truncate">{item.subject}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.customerName} · {formatDateTime(item.occurredAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <TablePagination
            className="mt-3"
            totalItems={activities.length}
            page={activitiesPage}
            pageSize={actPageSize}
            pageSizeOptions={pageSizeOptions}
            onPageChange={setActivitiesPage}
            onPageSizeChange={(size) => { setActPageSize(size); setActivitiesPage(1); }}
          />
        </div>
      )}

      {followUps.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Follow-Ups ({followUps.length})</p>
          <div className="bg-card border rounded-lg divide-y">
            {pagedFollowUps.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{item.title}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.customerName} · Due {formatDate(item.dueDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <TablePagination
            className="mt-3"
            totalItems={followUps.length}
            page={followUpsPage}
            pageSize={fuPageSize}
            pageSizeOptions={pageSizeOptions}
            onPageChange={setFollowUpsPage}
            onPageSizeChange={(size) => { setFuPageSize(size); setFollowUpsPage(1); }}
          />
        </div>
      )}
    </div>
  );
}

function SyncHistory({ records }: { records: SyncRecord[] }) {
  const { historyPage, setHistoryPage } = useSyncStore();
  const { pageSize, setPageSize, pageSizeOptions } = usePaginationPreference('syncHistory');

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const safePage = Math.min(historyPage, totalPages);
  const pagedRecords = records.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-3">Sync History</h3>
      <div className="bg-card border rounded-lg divide-y">
        {pagedRecords.map((record) => {
          const config = STATUS_CONFIG[record.status];
          const StatusIcon = config.icon;
          return (
            <div key={record.id} className="flex items-center gap-3 px-4 py-3">
              <StatusIcon size={16} className={`${config.color} ${record.status === 'running' ? 'animate-spin' : ''} flex-shrink-0`} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{SYNC_TYPE_LABELS[record.syncType] ?? record.syncType}</span>
                  <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDateTime(record.startedAt)}
                  {record.recordsPulled > 0 && ` · ${record.recordsPulled} pulled`}
                  {record.recordsPushed > 0 && ` · ${record.recordsPushed} pushed`}
                </p>
                {record.errorMessage && (
                  <p className="text-xs text-destructive mt-0.5">{record.errorMessage}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <TablePagination
        className="mt-4"
        totalItems={records.length}
        page={safePage}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageChange={setHistoryPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
