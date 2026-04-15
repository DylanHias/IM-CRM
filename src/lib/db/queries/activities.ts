import { getDb } from '@/lib/db/client';
import type { Activity } from '@/types/entities';
import type { ActivityRow } from '@/types/db';


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
    activityStatus: (row.activity_status ?? 'open') as Activity['activityStatus'],
    direction: (row.direction as Activity['direction']) ?? null,
    createdById: row.created_by_id,
    createdByName: row.created_by_name,
    syncStatus: row.sync_status as Activity['syncStatus'],
    remoteId: row.remote_id,
    source: (row.source ?? 'local') as Activity['source'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function queryAllActivities(): Promise<Activity[]> {
  const db = await getDb();
  const rows = await db.select<ActivityRow[]>(
    `SELECT * FROM activities ORDER BY occurred_at DESC`
  );
  return rows.map(rowToActivity);
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

export interface PendingActivitySyncItem {
  id: string;
  customerId: string;
  customerName: string;
  type: string;
  subject: string;
  occurredAt: string;
  createdAt: string;
}

export async function queryPendingActivitiesForSync(): Promise<PendingActivitySyncItem[]> {
  const db = await getDb();
  return db.select<PendingActivitySyncItem[]>(
    `SELECT a.id, a.customer_id as customerId, COALESCE(c.name, a.customer_id) as customerName,
            a.type, a.subject, a.occurred_at as occurredAt, a.created_at as createdAt
     FROM activities a LEFT JOIN customers c ON c.id = a.customer_id
     WHERE a.sync_status = 'pending' ORDER BY a.created_at ASC`
  );
}

export async function insertActivity(activity: Activity): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO activities (
      id, customer_id, contact_id, type, subject, description, occurred_at, start_time,
      activity_status, direction, created_by_id, created_by_name, sync_status, remote_id, source, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      activity.id, activity.customerId, activity.contactId, activity.type,
      activity.subject, activity.description, activity.occurredAt, activity.startTime,
      activity.activityStatus, activity.direction, activity.createdById, activity.createdByName, activity.syncStatus,
      activity.remoteId, activity.source ?? 'local', activity.createdAt, activity.updatedAt,
    ]
  );

}

export async function updateActivity(activity: Activity): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE activities SET type=$1, subject=$2, description=$3, occurred_at=$4, start_time=$5, contact_id=$6, activity_status=$7, direction=$8, sync_status='pending', updated_at=$9 WHERE id=$10`,
    [activity.type, activity.subject, activity.description, activity.occurredAt, activity.startTime, activity.contactId, activity.activityStatus, activity.direction, new Date().toISOString(), activity.id]
  );

}

export async function deleteActivity(id: string): Promise<{ remoteId: string | null; type: string } | null> {
  const db = await getDb();
  const rows = await db.select<ActivityRow[]>(`SELECT * FROM activities WHERE id=$1`, [id]);
  await db.execute(`DELETE FROM activities WHERE id=$1`, [id]);
  if (rows[0]) {
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

  // Null out contact reference if it doesn't exist locally (inactive or filtered out)
  let contactId = activity.contactId;
  if (contactId) {
    const contactExists = await db.select<{ id: string }[]>(
      `SELECT id FROM contacts WHERE id = $1`,
      [contactId]
    );
    if (contactExists.length === 0) {
      contactId = null;
    }
  }

  if (existing.length > 0) {
    // Update existing record
    await db.execute(
      `UPDATE activities SET customer_id=$1, contact_id=$2, type=$3, subject=$4, description=$5,
       occurred_at=$6, start_time=$7, activity_status=$8, direction=$9, created_by_id=$10, created_by_name=$11,
       sync_status='synced', source='d365', updated_at=$12
       WHERE remote_id=$13`,
      [
        activity.customerId, contactId, activity.type,
        activity.subject, activity.description, activity.occurredAt, activity.startTime,
        activity.activityStatus, activity.direction, activity.createdById, activity.createdByName, activity.updatedAt, activity.remoteId,
      ]
    );
  } else {
    // Insert new record
    await db.execute(
      `INSERT INTO activities (
        id, customer_id, contact_id, type, subject, description, occurred_at, start_time,
        activity_status, direction, created_by_id, created_by_name, sync_status, remote_id, source, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        activity.id, activity.customerId, contactId, activity.type,
        activity.subject, activity.description, activity.occurredAt, activity.startTime,
        activity.activityStatus, activity.direction, activity.createdById, activity.createdByName, 'synced',
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
