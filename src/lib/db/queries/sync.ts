import { getDb } from '@/lib/db/client';
import type { SyncRecord } from '@/types/sync';
import type { SyncRecordRow } from '@/types/db';

export function rowToSyncRecord(row: SyncRecordRow): SyncRecord {
  return {
    id: row.id,
    syncType: row.sync_type as SyncRecord['syncType'],
    status: row.status as SyncRecord['status'],
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    recordsPulled: row.records_pulled,
    recordsPushed: row.records_pushed,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

export async function insertSyncRecord(
  syncType: SyncRecord['syncType'],
  status: SyncRecord['status'],
  startedAt: string
): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO sync_records (sync_type, status, started_at, created_at) VALUES ($1,$2,$3,$3)`,
    [syncType, status, startedAt]
  );
  return result.lastInsertId ?? 0;
}

export async function updateSyncRecord(
  id: number,
  status: SyncRecord['status'],
  recordsPulled: number,
  recordsPushed: number,
  errorMessage: string | null
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE sync_records SET status=$1, finished_at=$2, records_pulled=$3, records_pushed=$4, error_message=$5 WHERE id=$6`,
    [status, new Date().toISOString(), recordsPulled, recordsPushed, errorMessage, id]
  );
}

export async function queryRecentSyncRecords(limit = 20): Promise<SyncRecord[]> {
  const db = await getDb();
  const rows = await db.select<SyncRecordRow[]>(
    `SELECT * FROM sync_records ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return rows.map(rowToSyncRecord);
}

export async function getAppSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    `SELECT value FROM app_settings WHERE key = $1`,
    [key]
  );
  return rows[0]?.value ?? null;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO app_settings (key, value, updated_at) VALUES ($1,$2,datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`,
    [key, value]
  );
}
