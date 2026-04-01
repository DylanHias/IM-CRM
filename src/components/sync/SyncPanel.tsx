'use client';

import { RefreshCw, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSync } from '@/hooks/useSync';
import { useSyncStore } from '@/store/syncStore';
import { useSettingsStore } from '@/store/settingsStore';
import { formatDateTime, formatRelative } from '@/lib/utils/dateUtils';
import type { SyncRecord } from '@/types/sync';

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

interface SyncPanelProps {
  records: SyncRecord[];
}

export function SyncPanel({ records }: SyncPanelProps) {
  const {
    isSyncing, isOnline, lastD365SyncAt,
    pendingActivityCount, pendingFollowUpCount, triggerSync,
  } = useSync();

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

      {/* Sync button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={triggerSync}
          disabled={isSyncing || !isOnline}
          className="gap-2"
        >
          <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Run Full Sync'}
        </Button>
        {!isOnline && (
          <p className="text-sm text-muted-foreground">
            You are offline. Connect to sync.
          </p>
        )}
      </div>

      {/* Sync history */}
      {records.length > 0 && (
        <SyncHistory records={records} />
      )}
    </div>
  );
}

function SyncHistory({ records }: { records: SyncRecord[] }) {
  const { historyPage, setHistoryPage } = useSyncStore();
  const itemsPerPage = useSettingsStore((s) => s.itemsPerPage);

  const totalPages = Math.max(1, Math.ceil(records.length / itemsPerPage));
  const safePage = Math.min(historyPage, totalPages);
  const pagedRecords = records.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

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
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-3">
          <p className="text-xs text-muted-foreground">
            {(safePage - 1) * itemsPerPage + 1}&ndash;{Math.min(safePage * itemsPerPage, records.length)} of {records.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage <= 1}
              onClick={() => setHistoryPage(safePage - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {safePage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={safePage >= totalPages}
              onClick={() => setHistoryPage(safePage + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
