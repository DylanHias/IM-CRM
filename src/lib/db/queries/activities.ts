import { getDb } from '@/lib/db/client';
import type { Activity } from '@/types/entities';
import type { ActivityRow } from '@/types/db';
import { logAudit } from '@/lib/db/auditHelper';

function rowToActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    customerId: row.customer_id,
    contactId: row.contact_id,
    type: row.type as Activity['type'],
    subject: row.subject,
    description: row.description,
    occurredAt: row.occurred_at,
    startTime: row.start_time,
    createdById: row.created_by_id,
    createdByName: row.created_by_name,
    syncStatus: row.sync_status as Activity['syncStatus'],
    remoteId: row.remote_id,
    source: (row.source ?? 'local') as Activity['source'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function queryActivitiesByCustomer(customerId: string): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.select<ActivityRow[]>(
    `SELECT * FROM activities WHERE customer_id = $1 ORDER BY occurred_at DESC`,
    [customerId]
  );
  return rows.map(rowToActivity);
}

export async function queryPendingActivities(): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.select<ActivityRow[]>(
    `SELECT * FROM activities WHERE sync_status = 'pending' ORDER BY created_at`
  );
  return rows.map(rowToActivity);
}

export async function insertActivity(activity: Activity): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO activities (
      id, customer_id, contact_id, type, subject, description, occurred_at, start_time,
      created_by_id, created_by_name, sync_status, remote_id, source, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      activity.id, activity.customerId, activity.contactId, activity.type,
      activity.subject, activity.description, activity.occurredAt, activity.startTime,
      activity.createdById, activity.createdByName, activity.syncStatus,
      activity.remoteId, activity.source ?? 'local', activity.createdAt, activity.updatedAt,
    ]
  );
  logAudit('activity', activity.id, 'create', activity.createdById, activity.createdByName, null, { type: activity.type, subject: activity.subject });
}

export async function updateActivity(activity: Activity): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE activities SET type=$1, subject=$2, description=$3, occurred_at=$4, start_time=$5, contact_id=$6, sync_status='pending', updated_at=$7 WHERE id=$8`,
    [activity.type, activity.subject, activity.description, activity.occurredAt, activity.startTime, activity.contactId, new Date().toISOString(), activity.id]
  );
  logAudit('activity', activity.id, 'update', activity.createdById, activity.createdByName, null, { type: activity.type, subject: activity.subject });
}

export async function deleteActivity(id: string): Promise<{ remoteId: string | null; type: string } | null> {
  const db = await getDb();
  const rows = await db.select<ActivityRow[]>(`SELECT * FROM activities WHERE id=$1`, [id]);
  await db.execute(`DELETE FROM activities WHERE id=$1`, [id]);
  if (rows[0]) {
    logAudit('activity', id, 'delete', rows[0].created_by_id, rows[0].created_by_name, { subject: rows[0].subject }, null);
    return { remoteId: rows[0].remote_id, type: rows[0].type };
  }
  return null;
}

export async function markActivitySynced(id: string, remoteId: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE activities SET sync_status = 'synced', remote_id = $1, updated_at = $2 WHERE id = $3`,
    [remoteId, new Date().toISOString(), id]
  );
}

export async function markActivitySyncError(id: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE activities SET sync_status = 'error', updated_at = $1 WHERE id = $2`,
    [new Date().toISOString(), id]
  );
}

export async function upsertPulledActivity(activity: Activity): Promise<boolean> {
  const db = await getDb();

  // Skip if this remote_id exists locally with pending changes (local edits take priority)
  const existing = await db.select<ActivityRow[]>(
    `SELECT id, sync_status FROM activities WHERE remote_id = $1`,
    [activity.remoteId]
  );
  if (existing.length > 0 && existing[0].sync_status === 'pending') {
    return false;
  }

  // Check that the customer exists locally (Benelux scope filter)
  const customerExists = await db.select<{ id: string }[]>(
    `SELECT id FROM customers WHERE id = $1`,
    [activity.customerId]
  );
  if (customerExists.length === 0) {
    return false;
  }

  // Skip if contact doesn't exist locally (inactive or filtered out)
  if (activity.contactId) {
    const contactExists = await db.select<{ id: string }[]>(
      `SELECT id FROM contacts WHERE id = $1`,
      [activity.contactId]
    );
    if (contactExists.length === 0) {
      console.log(`[sync] Skipped activity ${activity.remoteId}: contact ${activity.contactId} not found locally`);
      return false;
    }
  }

  if (existing.length > 0) {
    // Update existing record
    await db.execute(
      `UPDATE activities SET customer_id=$1, contact_id=$2, type=$3, subject=$4, description=$5,
       occurred_at=$6, start_time=$7, created_by_id=$8, created_by_name=$9,
       sync_status='synced', source='d365', updated_at=$10
       WHERE remote_id=$11`,
      [
        activity.customerId, activity.contactId, activity.type,
        activity.subject, activity.description, activity.occurredAt, activity.startTime,
        activity.createdById, activity.createdByName, activity.updatedAt, activity.remoteId,
      ]
    );
  } else {
    // Insert new record
    await db.execute(
      `INSERT INTO activities (
        id, customer_id, contact_id, type, subject, description, occurred_at, start_time,
        created_by_id, created_by_name, sync_status, remote_id, source, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        activity.id, activity.customerId, activity.contactId, activity.type,
        activity.subject, activity.description, activity.occurredAt, activity.startTime,
        activity.createdById, activity.createdByName, 'synced',
        activity.remoteId, 'd365', activity.createdAt, activity.updatedAt,
      ]
    );
  }
  return true;
}

export async function countPendingActivities(): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM activities WHERE sync_status = 'pending'`
  );
  return rows[0]?.count ?? 0;
}
