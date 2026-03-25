import { getDb } from '@/lib/db/client';
import type {
  DataQualityMetrics,
  ActivityTimelinePoint,
  PipelineStats,
  TableStats,
  SyncHealthMetrics,
} from '@/types/admin';
import type { SyncRecordRow } from '@/types/db';
import type { SyncRecord } from '@/types/sync';

function rowToSyncRecord(row: SyncRecordRow): SyncRecord {
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

export async function queryDataQualityMetrics(staleActivityDays = 90): Promise<DataQualityMetrics> {
  const db = await getDb();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - staleActivityDays);
  const cutoffStr = cutoff.toISOString();

  const [withoutContacts] = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM customers c WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE customer_id = c.id)`
  );
  const [withoutActivity] = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM customers c WHERE NOT EXISTS (SELECT 1 FROM activities WHERE customer_id = c.id AND occurred_at > $1)`,
    [cutoffStr]
  );
  const [staleOpps] = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM opportunities WHERE status = 'Open' AND expiration_date IS NOT NULL AND expiration_date < datetime('now')`
  );
  const [totalCustomers] = await db.select<{ count: number }[]>(`SELECT COUNT(*) as count FROM customers`);
  const [totalContacts] = await db.select<{ count: number }[]>(`SELECT COUNT(*) as count FROM contacts`);
  const [totalActivities] = await db.select<{ count: number }[]>(`SELECT COUNT(*) as count FROM activities`);

  return {
    customersWithoutContacts: withoutContacts?.count ?? 0,
    customersWithoutRecentActivity: withoutActivity?.count ?? 0,
    staleOpportunities: staleOpps?.count ?? 0,
    totalCustomers: totalCustomers?.count ?? 0,
    totalContacts: totalContacts?.count ?? 0,
    totalActivities: totalActivities?.count ?? 0,
  };
}

export async function queryActivityTimeline(): Promise<ActivityTimelinePoint[]> {
  const db = await getDb();
  const rows = await db.select<{ date: string; type: string; count: number }[]>(
    `SELECT strftime('%Y-%m-%d', occurred_at) as date, type, COUNT(*) as count
     FROM activities
     WHERE occurred_at >= datetime('now', '-90 days')
     GROUP BY date, type
     ORDER BY date`
  );

  const map = new Map<string, ActivityTimelinePoint>();
  for (const { date, type, count } of rows) {
    if (!map.has(date)) {
      map.set(date, { date, meeting: 0, call: 0, visit: 0, note: 0 });
    }
    const point = map.get(date)!;
    if (type === 'meeting' || type === 'call' || type === 'visit' || type === 'note') {
      point[type] = count;
    }
  }
  return Array.from(map.values());
}

export async function queryActivityBreakdownByUser(): Promise<{ userName: string; count: number }[]> {
  const db = await getDb();
  return db.select<{ userName: string; count: number }[]>(
    `SELECT created_by_name as userName, COUNT(*) as count
     FROM activities
     GROUP BY created_by_id
     ORDER BY count DESC`
  );
}

export async function queryPipelineByStage(): Promise<PipelineStats[]> {
  const db = await getDb();
  return db.select<PipelineStats[]>(
    `SELECT stage, COUNT(*) as count, COALESCE(SUM(estimated_revenue), 0) as totalRevenue
     FROM opportunities
     WHERE status = 'Open'
     GROUP BY stage
     ORDER BY count DESC`
  );
}

export async function queryWinRate(): Promise<{ won: number; lost: number; open: number }> {
  const db = await getDb();
  const rows = await db.select<{ status: string; count: number }[]>(
    `SELECT status, COUNT(*) as count FROM opportunities GROUP BY status`
  );
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status] = r.count;
  return { won: map['Won'] ?? 0, lost: map['Lost'] ?? 0, open: map['Open'] ?? 0 };
}

export async function queryTableStats(): Promise<TableStats[]> {
  const db = await getDb();
  const tables = ['customers', 'contacts', 'activities', 'trainings', 'follow_ups', 'opportunities', 'invoices', 'invoice_lines', 'sync_records', 'users', 'audit_log'];
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
    `SELECT * FROM sync_records WHERE status = 'error' ORDER BY created_at DESC LIMIT $1`,
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
