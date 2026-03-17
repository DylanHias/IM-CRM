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

export async function queryOverdueFollowUpCount(): Promise<number> {
  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const rows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM follow_ups WHERE completed = 0 AND due_date < $1`,
    [today]
  );
  return rows[0]?.count ?? 0;
}

export async function insertFollowUp(followUp: FollowUp): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO follow_ups (
      id, customer_id, activity_id, title, description, due_date, completed,
      completed_at, created_by_id, created_by_name, sync_status, remote_id, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      followUp.id, followUp.customerId, followUp.activityId, followUp.title,
      followUp.description, followUp.dueDate, followUp.completed ? 1 : 0,
      followUp.completedAt, followUp.createdById, followUp.createdByName,
      followUp.syncStatus, followUp.remoteId, followUp.createdAt, followUp.updatedAt,
    ]
  );
}

export async function updateFollowUp(followUp: FollowUp): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE follow_ups SET title=$1, description=$2, due_date=$3, sync_status='pending', updated_at=$4 WHERE id=$5`,
    [followUp.title, followUp.description, followUp.dueDate, new Date().toISOString(), followUp.id]
  );
}

export async function deleteFollowUp(id: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM follow_ups WHERE id=$1`, [id]);
}

export async function completeFollowUp(id: string): Promise<void> {
  const now = new Date().toISOString();
  const db = await getDb();
  await db.execute(
    `UPDATE follow_ups SET completed = 1, completed_at = $1, updated_at = $2, sync_status = 'pending' WHERE id = $3`,
    [now, now, id]
  );
}

export async function markFollowUpSynced(id: string, remoteId: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE follow_ups SET sync_status = 'synced', remote_id = $1, updated_at = $2 WHERE id = $3`,
    [remoteId, new Date().toISOString(), id]
  );
}

export async function countPendingFollowUps(): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM follow_ups WHERE sync_status = 'pending'`
  );
  return rows[0]?.count ?? 0;
}
