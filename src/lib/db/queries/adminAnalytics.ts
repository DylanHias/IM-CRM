import { getDb } from '@/lib/db/client';
import { rowToSyncRecord } from '@/lib/db/queries/sync';
import type { TableStats, SyncHealthMetrics } from '@/types/admin';
import type { SyncRecordRow } from '@/types/db';
import type { SyncRecord } from '@/types/sync';

export async function queryTableStats(): Promise<TableStats[]> {
  const db = await getDb();
  const tables = ['customers', 'contacts', 'activities', 'follow_ups', 'opportunities', 'sync_records', 'users'];
  const stats: TableStats[] = [];

  for (const tableName of tables) {
    try {
      const rows = await db.select<{ count: number }[]>(`SELECT COUNT(*) as count FROM ${tableName}`);
      stats.push({ tableName, rowCount: rows[0]?.count ?? 0 });
    } catch (err) {
      console.error(`[admin] Table stats query failed for ${tableName}:`, err);
      stats.push({ tableName, rowCount: 0 });
    }
  }

  return stats;
}

export async function querySyncHealthMetrics(): Promise<SyncHealthMetrics> {
  const db = await getDb();

  const [total] = await db.select<{ count: number }[]>(`SELECT COUNT(*) as count FROM sync_records`);
  const [success] = await db.select<{ count: number }[]>(`SELECT COUNT(*) as count FROM sync_records WHERE status = 'success'`);
  const [errors] = await db.select<{ count: number }[]>(`SELECT COUNT(*) as count FROM sync_records WHERE status = 'error'`);
  const [avgDuration] = await db.select<{ avg: number | null }[]>(
    `SELECT AVG((julianday(finished_at) - julianday(started_at)) * 86400000) as avg FROM sync_records WHERE finished_at IS NOT NULL`
  );
  const [totalRecords] = await db.select<{ total: number }[]>(
    `SELECT COALESCE(SUM(records_pulled + records_pushed), 0) as total FROM sync_records`
  );

  const totalSyncs = total?.count ?? 0;

  return {
    totalSyncs,
    successCount: success?.count ?? 0,
    errorCount: errors?.count ?? 0,
    successRate: totalSyncs > 0 ? ((success?.count ?? 0) / totalSyncs) * 100 : 0,
    avgDurationMs: Math.round(avgDuration?.avg ?? 0),
    totalRecordsProcessed: totalRecords?.total ?? 0,
  };
}

export async function querySyncErrors(limit = 20): Promise<SyncRecord[]> {
  const db = await getDb();
  const rows = await db.select<SyncRecordRow[]>(
    `SELECT * FROM sync_records WHERE status IN ('error', 'partial') ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return rows.map(rowToSyncRecord);
}

export async function purgeSyncRecordsBefore(date: string): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `DELETE FROM sync_records WHERE created_at < $1`,
    [date]
  );
  return result.rowsAffected ?? 0;
}
