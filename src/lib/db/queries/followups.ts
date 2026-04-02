import { getDb } from '@/lib/db/client';
import type { FollowUp } from '@/types/entities';
import type { FollowUpRow } from '@/types/db';
import { logAudit } from '@/lib/db/auditHelper';

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

export async function queryDueTodayFollowUpCount(): Promise<number> {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const rows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM follow_ups WHERE completed = 0 AND due_date = $1`,
    [today]
  );
  return rows[0]?.count ?? 0;
}

export async function queryUpcomingFollowUpCount(withinDays: number): Promise<number> {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const future = new Date(Date.now() + withinDays * 86400000).toISOString().split('T')[0];
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
  logAudit('follow_up', followUp.id, 'create', followUp.createdById, followUp.createdByName, null, { title: followUp.title, dueDate: followUp.dueDate });
}

export async function updateFollowUp(followUp: FollowUp): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE follow_ups SET title=$1, description=$2, due_date=$3, sync_status='pending', updated_at=$4 WHERE id=$5`,
    [followUp.title, followUp.description, followUp.dueDate, new Date().toISOString(), followUp.id]
  );
  logAudit('follow_up', followUp.id, 'update', followUp.createdById, followUp.createdByName, null, { title: followUp.title, dueDate: followUp.dueDate });
}

export async function deleteFollowUp(id: string): Promise<{ remoteId: string | null } | null> {
  const db = await getDb();
  const rows = await db.select<FollowUpRow[]>(`SELECT * FROM follow_ups WHERE id=$1`, [id]);
  await db.execute(`DELETE FROM follow_ups WHERE id=$1`, [id]);
  if (rows[0]) {
    logAudit('follow_up', id, 'delete', rows[0].created_by_id, rows[0].created_by_name, { title: rows[0].title }, null);
    return { remoteId: rows[0].remote_id };
  }
  return null;
}

export async function completeFollowUp(id: string): Promise<void> {
  const now = new Date().toISOString();
  const db = await getDb();
  const rows = await db.select<FollowUpRow[]>(`SELECT * FROM follow_ups WHERE id=$1`, [id]);
  await db.execute(
    `UPDATE follow_ups SET completed = 1, completed_at = $1, updated_at = $2, sync_status = 'pending' WHERE id = $3`,
    [now, now, id]
  );
  if (rows[0]) {
    logAudit('follow_up', id, 'update', rows[0].created_by_id, rows[0].created_by_name, { completed: false }, { completed: true });
  }
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

export async function countPendingFollowUps(): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM follow_ups WHERE sync_status = 'pending'`
  );
  return rows[0]?.count ?? 0;
}
