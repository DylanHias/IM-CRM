import { getDb } from '@/lib/db/client';
import type { AuditLogEntry, AuditLogFilters } from '@/types/admin';
import type { AuditLogRow } from '@/types/db';

function rowToAuditEntry(row: AuditLogRow): AuditLogEntry {
  return {
    id: row.id,
    entityType: row.entity_type as AuditLogEntry['entityType'],
    entityId: row.entity_id,
    action: row.action as AuditLogEntry['action'],
    changedById: row.changed_by_id,
    changedByName: row.changed_by_name,
    oldValues: row.old_values ? JSON.parse(row.old_values) : null,
    newValues: row.new_values ? JSON.parse(row.new_values) : null,
    changedAt: row.changed_at,
  };
}

export async function insertAuditLog(entry: Omit<AuditLogEntry, 'id'>): Promise<void> {
  try {
    const db = await getDb();
    await db.execute(
      `INSERT INTO audit_log (entity_type, entity_id, action, changed_by_id, changed_by_name, old_values, new_values, changed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        entry.entityType, entry.entityId, entry.action,
        entry.changedById, entry.changedByName,
        entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        entry.newValues ? JSON.stringify(entry.newValues) : null,
        entry.changedAt,
      ]
    );
  } catch (err) {
    console.error('[audit] Failed to insert audit log:', err);
  }
}

export async function queryAuditLog(filters: AuditLogFilters): Promise<AuditLogEntry[]> {
  const db = await getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters.entityType) {
    conditions.push(`entity_type = $${paramIdx++}`);
    params.push(filters.entityType);
  }
  if (filters.action) {
    conditions.push(`action = $${paramIdx++}`);
    params.push(filters.action);
  }
  if (filters.changedById) {
    conditions.push(`changed_by_id = $${paramIdx++}`);
    params.push(filters.changedById);
  }
  if (filters.dateFrom) {
    conditions.push(`changed_at >= $${paramIdx++}`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`changed_at <= $${paramIdx++}`);
    params.push(filters.dateTo);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(filters.limit);
  params.push(filters.offset);

  const rows = await db.select<AuditLogRow[]>(
    `SELECT * FROM audit_log ${where} ORDER BY changed_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    params
  );
  return rows.map(rowToAuditEntry);
}

export async function queryAuditLogCount(filters: Omit<AuditLogFilters, 'limit' | 'offset'>): Promise<number> {
  const db = await getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters.entityType) {
    conditions.push(`entity_type = $${paramIdx++}`);
    params.push(filters.entityType);
  }
  if (filters.action) {
    conditions.push(`action = $${paramIdx++}`);
    params.push(filters.action);
  }
  if (filters.changedById) {
    conditions.push(`changed_by_id = $${paramIdx++}`);
    params.push(filters.changedById);
  }
  if (filters.dateFrom) {
    conditions.push(`changed_at >= $${paramIdx++}`);
    params.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`changed_at <= $${paramIdx}`);
    params.push(filters.dateTo);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM audit_log ${where}`,
    params
  );
  return rows[0]?.count ?? 0;
}

export async function purgeAuditLogBefore(date: string): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `DELETE FROM audit_log WHERE changed_at < $1`,
    [date]
  );
  return result.rowsAffected ?? 0;
}
