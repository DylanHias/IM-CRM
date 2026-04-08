export type SyncType = 'd365' | 'push_activities' | 'push_followups' | 'push_opportunities';
export type SyncStatus = 'running' | 'success' | 'partial' | 'error';

export interface SyncRecord {
  id: number;
  syncType: SyncType;
  status: SyncStatus;
  startedAt: string;
  finishedAt: string | null;
  recordsPulled: number;
  recordsPushed: number;
  errorMessage: string | null;
  createdAt: string;
}

export interface SyncError {
  id: string;
  syncType: SyncType;
  message: string;
  occurredAt: string;
}