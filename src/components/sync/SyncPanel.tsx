'use client';

import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSync } from '@/hooks/useSync';
import { formatDateTime, formatRelative } from '@/lib/utils/dateUtils';
import type { SyncRecord } from '@/types/sync';

const STATUS_CONFIG = {
  running: { icon: RefreshCw, color: 'text-blue-500', variant: 'info' as const, label: 'Running' },
  success: { icon: CheckCircle, color: 'text-green-500', variant: 'success' as const, label: 'Success' },
  partial: { icon: AlertTriangle, color: 'text-yellow-500', variant: 'warning' as const, label: 'Partial' },
  error: { icon: XCircle, color: 'text-red-500', variant: 'destructive' as const, label: 'Error' },
};

const SYNC_TYPE_LABELS: Record<string, string> = {
  d365: 'Dynamics 365',
  training: 'Training API',
  push_activities: 'Push Activities',
  push_followups: 'Push Follow-Ups',
};

interface SyncPanelProps {
  records: SyncRecord[];
}

export function SyncPanel({ records }: SyncPanelProps) {
  const {
    isSyncing, isOnline, lastD365SyncAt, lastTrainingSyncAt,
    pendingActivityCount, pendingFollowUpCount, triggerSync,
  } = useSync();

  return (
    <div className="space-y-5">
      {/* Status overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">D365 Last Sync</p>
          <p className="text-sm font-medium mt-1">
            {lastD365SyncAt ? formatRelative(lastD365SyncAt) : 'Never'}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Training Last Sync</p>
          <p className="text-sm font-medium mt-1">
            {lastTrainingSyncAt ? formatRelative(lastTrainingSyncAt) : 'Never'}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Pending Activities</p>
          <p className="text-xl font-bold mt-1 text-amber-600">{pendingActivityCount}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Pending Follow-Ups</p>
          <p className="text-xl font-bold mt-1 text-amber-600">{pendingFollowUpCount}</p>
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
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Sync History</h3>
          <div className="bg-white border rounded-lg divide-y">
            {records.map((record) => {
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
                      <p className="text-xs text-red-600 mt-0.5">{record.errorMessage}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
