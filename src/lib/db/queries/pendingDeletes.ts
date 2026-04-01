import { getDb } from '@/lib/db/client';

interface PendingDelete {
  id: number;
  entityType: string;
  remoteId: string;
}

export async function insertPendingDelete(entityType: string, remoteId: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO pending_deletes (entity_type, remote_id) VALUES ($1, $2)`,
    [entityType, remoteId]
  );
}

export async function queryPendingDeletes(): Promise<PendingDelete[]> {
  const db = await getDb();
  const rows = await db.select<{ id: number; entity_type: string; remote_id: string }[]>(
    `SELECT id, entity_type, remote_id FROM pending_deletes ORDER BY created_at`
  );
  return rows.map((r) => ({ id: r.id, entityType: r.entity_type, remoteId: r.remote_id }));
}

export async function removePendingDelete(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM pending_deletes WHERE id = $1`, [id]);
}
