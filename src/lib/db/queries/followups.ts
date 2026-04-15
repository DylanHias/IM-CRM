import { getDb } from '@/lib/db/client';
import type { FollowUp } from '@/types/entities';
import type { FollowUpRow } from '@/types/db';


function rowToFollowUp(row: FollowUpRow): FollowUp {
  return {
    id: row.id,
    customerId: row.customer_id,
    activityId: row.activity_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    completed: row.completed === 1,
    completedAt: row.completed_at,
    createdById: row.created_by_id,
    createdByName: row.created_by_name,
    syncStatus: row.sync_status as FollowUp['syncStatus'],
    remoteId: row.remote_id,
    source: (row.source ?? 'local') as FollowUp['source'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function queryAllFollowUps(): Promise<FollowUp[]> {
  const db = await getDb();
  const rows = await db.select<FollowUpRow[]>(
    `SELECT * FROM follow_ups ORDER BY completed ASC, due_date ASC`
  );
  return rows.map(rowToFollowUp);
}

export async function queryFollowUpsByUser(userId: string, altUserId?: string): Promise<FollowUp[]> {
  const db = await getDb();
  if (altUserId && altUserId !== userId) {
    const rows = await db.select<FollowUpRow[]>(
      `SELECT * FROM follow_ups WHERE created_by_id IN ($1, $2) ORDER BY completed ASC, due_date ASC`,
      [userId, altUserId]
    );
    return rows.map(rowToFollowUp);
  }
  const rows = await db.select<FollowUpRow[]>(
    `SELECT * FROM follow_ups WHERE created_by_id = $1 ORDER BY completed ASC, due_date ASC`,
    [userId]
  );
  return rows.map(rowToFollowUp);
}

export async function queryFollowUpsByCustomer(customerId: string): Promise<FollowUp[]> {
  const db = await getDb();
  const rows = await db.select<FollowUpRow[]>(
    `SELECT * FROM follow_ups WHERE customer_id = $1 ORDER BY completed ASC, due_date ASC`,
    [customerId]
  );
  return rows.map(rowToFollowUp);
}

export async function queryPendingFollowUps(): Promise<FollowUp[]> {
  const db = await getDb();
  const rows = await db.select<FollowUpRow[]>(
    `SELECT * FROM follow_ups WHERE sync_status = 'pending' ORDER BY created_at`
  );
  return rows.map(rowToFollowUp);
}

export interface PendingFollowUpSyncItem {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  dueDate: string;
  createdAt: string;
}

export async function queryPendingFollowUpsForSync(): Promise<PendingFollowUpSyncItem[]> {
  const db = await getDb();
  return db.select<PendingFollowUpSyncItem[]>(
    `SELECT f.id, f.customer_id as customerId, COALESCE(c.name, f.customer_id) as customerName,
            f.title, f.due_date as dueDate, f.created_at as createdAt
     FROM follow_ups f LEFT JOIN customers c ON c.id = f.customer_id
     WHERE f.sync_status = 'pending' ORDER BY f.created_at ASC`
  );
}

export async function queryOverdueFollowUpCount(userId?: string, altUserId?: string): Promise<number> {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  if (userId && altUserId && altUserId !== userId) {
    const rows = await db.select<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM follow_ups WHERE completed = 0 AND due_date < $1 AND created_by_id IN ($2, $3)`,
      [today, userId, altUserId]
    );
    return rows[0]?.count ?? 0;
  }
  if (userId) {
    const rows = await db.select<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM follow_ups WHERE completed = 0 AND due_date < $1 AND created_by_id = $2`,
      [today, userId]
    );
    return rows[0]?.count ?? 0;
  }
  const rows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM follow_ups WHERE completed = 0 AND due_date < $1`,
    [today]
  );
  return rows[0]?.count ?? 0;
}

export async function queryDueTodayFollowUpCount(userId?: string, altUserId?: string): Promise<number> {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  if (userId && altUserId && altUserId !== userId) {
    const rows = await db.select<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM follow_ups WHERE completed = 0 AND due_date = $1 AND created_by_id IN ($2, $3)`,
      [today, userId, altUserId]
    );
    return rows[0]?.count ?? 0;
  }
  if (userId) {
    const rows = await db.select<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM follow_ups WHERE completed = 0 AND due_date = $1 AND created_by_id = $2`,
      [today, userId]
    );
    return rows[0]?.count ?? 0;
  }
  const rows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM follow_ups WHERE completed = 0 AND due_date = $1`,
    [today]
  );
  return rows[0]?.count ?? 0;
}

export async function queryUpcomingFollowUpCount(withinDays: number, userId?: string, altUserId?: string): Promise<number> {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const future = new Date(Date.now() + withinDays * 86400000).toISOString().split('T')[0];
  if (userId && altUserId && altUserId !== userId) {
    const rows = await db.select<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM follow_ups WHERE completed = 0 AND due_date > $1 AND due_date <= $2 AND created_by_id IN ($3, $4)`,
      [today, future, userId, altUserId]
    );
    return rows[0]?.count ?? 0;
  }
  if (userId) {
    const rows = await db.select<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM follow_ups WHERE completed = 0 AND due_date > $1 AND due_date <= $2 AND created_by_id = $3`,
      [today, future, userId]
    );
    return rows[0]?.count ?? 0;
  }
  const rows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM follow_ups WHERE completed = 0 AND due_date > $1 AND due_date <= $2`,
    [today, future]
  );
  return rows[0]?.count ?? 0;
}

export async function insertFollowUp(followUp: FollowUp): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO follow_ups (
      id, customer_id, activity_id, title, description, due_date, completed,
      completed_at, created_by_id, created_by_name, sync_status, remote_id, source, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      followUp.id, followUp.customerId, followUp.activityId, followUp.title,
      followUp.description, followUp.dueDate, followUp.completed ? 1 : 0,
      followUp.completedAt, followUp.createdById, followUp.createdByName,
      followUp.syncStatus, followUp.remoteId, followUp.source ?? 'local', followUp.createdAt, followUp.updatedAt,
    ]
  );

}

export async function updateFollowUp(followUp: FollowUp): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE follow_ups SET title=$1, description=$2, due_date=$3, completed=$4, completed_at=$5, sync_status='pending', updated_at=$6 WHERE id=$7`,
    [followUp.title, followUp.description, followUp.dueDate, followUp.completed ? 1 : 0, followUp.completedAt, new Date().toISOString(), followUp.id]
  );
}

export async function deleteFollowUp(id: string): Promise<{ remoteId: string | null } | null> {
  const db = await getDb();
  const rows = await db.select<FollowUpRow[]>(`SELECT * FROM follow_ups WHERE id=$1`, [id]);
  await db.execute(`DELETE FROM follow_ups WHERE id=$1`, [id]);
  if (rows[0]) {
    return { remoteId: rows[0].remote_id };
  }
  return null;
}

export async function completeFollowUp(id: string): Promise<void> {
  const now = new Date().toISOString();
  const db = await getDb();
  await db.execute(
    `UPDATE follow_ups SET completed = 1, completed_at = $1, updated_at = $2, sync_status = 'pending' WHERE id = $3`,
    [now, now, id]
  );
}

export async function uncompleteFollowUp(id: string): Promise<void> {
  const now = new Date().toISOString();
  const db = await getDb();
  await db.execute(
    `UPDATE follow_ups SET completed = 0, completed_at = NULL, updated_at = $1, sync_status = 'pending' WHERE id = $2`,
    [now, id]
  );
}

export async function markFollowUpSynced(id: string, remoteId: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE follow_ups SET sync_status = 'synced', remote_id = $1, updated_at = $2 WHERE id = $3`,
    [remoteId, new Date().toISOString(), id]
  );
}

export async function upsertPulledFollowUp(followUp: FollowUp): Promise<boolean> {
  const db = await getDb();

  // Skip if this remote_id exists locally with pending changes
  const existing = await db.select<FollowUpRow[]>(
    `SELECT id, sync_status FROM follow_ups WHERE remote_id = $1`,
    [followUp.remoteId]
  );
  if (existing.length > 0 && existing[0].sync_status === 'pending') {
    return false;
  }

  // Check that the customer exists locally (Benelux scope filter)
  const customerExists = await db.select<{ id: string }[]>(
    `SELECT id FROM customers WHERE id = $1`,
    [followUp.customerId]
  );
  if (customerExists.length === 0) {
    return false;
  }

  if (existing.length > 0) {
    // Update existing record
    await db.execute(
      `UPDATE follow_ups SET customer_id=$1, title=$2, description=$3, due_date=$4,
       completed=$5, completed_at=$6, created_by_id=$7, created_by_name=$8,
       sync_status='synced', source='d365', updated_at=$9
       WHERE remote_id=$10`,
      [
        followUp.customerId, followUp.title, followUp.description, followUp.dueDate,
        followUp.completed ? 1 : 0, followUp.completedAt,
        followUp.createdById, followUp.createdByName, followUp.updatedAt, followUp.remoteId,
      ]
    );
  } else {
    // Insert new record
    await db.execute(
      `INSERT INTO follow_ups (
        id, customer_id, activity_id, title, description, due_date, completed,
        completed_at, created_by_id, created_by_name, sync_status, remote_id, source, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        followUp.id, followUp.customerId, followUp.activityId, followUp.title,
        followUp.description, followUp.dueDate, followUp.completed ? 1 : 0,
        followUp.completedAt, followUp.createdById, followUp.createdByName,
        'synced', followUp.remoteId, 'd365', followUp.createdAt, followUp.updatedAt,
      ]
    );
  }
  return true;
}

/** Load remote_id → {localId, syncStatus} map for all D365-pulled follow-ups. One query replaces N per-record SELECTs. */
export async function preloadFollowUpState(): Promise<Map<string, { localId: string; syncStatus: string }>> {
  const db = await getDb();
  const rows = await db.select<{ id: string; remote_id: string; sync_status: string }[]>(
    `SELECT id, remote_id, sync_status FROM follow_ups WHERE remote_id IS NOT NULL`,
  );
  const map = new Map<string, { localId: string; syncStatus: string }>();
  for (const row of rows) {
    map.set(row.remote_id, { localId: row.id, syncStatus: row.sync_status });
  }
  return map;
}

/**
 * Bulk upsert follow-ups fetched from D365.
 * - Filters out-of-scope records in memory.
 * - Multi-value INSERT for new records (66 rows/batch).
 * - Individual UPDATE for existing records.
 */
export async function bulkUpsertFollowUps(
  followUps: FollowUp[],
  customerIdSet: Set<string>,
  existing: Map<string, { localId: string; syncStatus: string }>,
): Promise<{ inserted: number; updated: number; skipped: number; errors: number }> {
  if (followUps.length === 0) return { inserted: 0, updated: 0, skipped: 0, errors: 0 };
  const db = await getDb();

  const toInsert: FollowUp[] = [];
  const toUpdate: FollowUp[] = [];
  let skipped = 0;

  for (const followUp of followUps) {
    if (!customerIdSet.has(followUp.customerId)) { skipped++; continue; }
    const prev = followUp.remoteId ? existing.get(followUp.remoteId) : undefined;
    if (prev) {
      if (prev.syncStatus === 'pending') { skipped++; continue; }
      toUpdate.push(followUp);
    } else {
      toInsert.push(followUp);
    }
  }

  const COLS = 15;
  const CHUNK = Math.floor(999 / COLS); // 66 rows per batch
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    const placeholders = chunk
      .map((_, j) => `(${Array.from({ length: COLS }, (__, k) => `$${j * COLS + k + 1}`).join(',')})`)
      .join(',');
    const values = chunk.flatMap((f) => [
      f.id, f.customerId, f.activityId, f.title, f.description, f.dueDate,
      f.completed ? 1 : 0, f.completedAt, f.createdById, f.createdByName,
      'synced', f.remoteId, 'd365', f.createdAt, f.updatedAt,
    ]);
    try {
      const result = await db.execute(
        `INSERT OR IGNORE INTO follow_ups (
          id, customer_id, activity_id, title, description, due_date, completed,
          completed_at, created_by_id, created_by_name, sync_status, remote_id, source, created_at, updated_at
        ) VALUES ${placeholders}`,
        values,
      );
      inserted += result.rowsAffected;
    } catch (err) {
      console.error('[followup] Bulk insert chunk failed:', err instanceof Error ? err.message : err);
      errors++;
    }
  }

  let updated = 0;
  for (const f of toUpdate) {
    try {
      await db.execute(
        `UPDATE follow_ups SET customer_id=$1, title=$2, description=$3, due_date=$4,
         completed=$5, completed_at=$6, created_by_id=$7, created_by_name=$8,
         sync_status='synced', source='d365', updated_at=$9
         WHERE remote_id=$10`,
        [
          f.customerId, f.title, f.description, f.dueDate,
          f.completed ? 1 : 0, f.completedAt,
          f.createdById, f.createdByName, f.updatedAt, f.remoteId,
        ],
      );
      updated++;
    } catch (err) {
      console.error(`[followup] Failed to update follow-up ${f.remoteId}:`, err instanceof Error ? err.message : err);
      errors++;
    }
  }

  return { inserted, updated, skipped, errors };
}

export async function queryDueTodayFollowUps(userId?: string, altUserId?: string): Promise<FollowUp[]> {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  if (userId && altUserId && altUserId !== userId) {
    const rows = await db.select<FollowUpRow[]>(
      `SELECT * FROM follow_ups WHERE completed = 0 AND due_date = $1 AND created_by_id IN ($2, $3) ORDER BY due_date ASC`,
      [today, userId, altUserId]
    );
    return rows.map(rowToFollowUp);
  }
  if (userId) {
    const rows = await db.select<FollowUpRow[]>(
      `SELECT * FROM follow_ups WHERE completed = 0 AND due_date = $1 AND created_by_id = $2 ORDER BY due_date ASC`,
      [today, userId]
    );
    return rows.map(rowToFollowUp);
  }
  const rows = await db.select<FollowUpRow[]>(
    `SELECT * FROM follow_ups WHERE completed = 0 AND due_date = $1 ORDER BY due_date ASC`,
    [today]
  );
  return rows.map(rowToFollowUp);
}

export async function countPendingFollowUps(): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM follow_ups WHERE sync_status = 'pending'`
  );
  return rows[0]?.count ?? 0;
}
