export type SyncType = 'd365' | 'training' | 'push_activities' | 'push_followups';
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

export interface SyncResult {
  syncType: SyncType;
  status: SyncStatus;
  recordsPulled: number;
  recordsPushed: number;
  errorMessage?: string;
}
