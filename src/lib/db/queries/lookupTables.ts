import { getDb } from '@/lib/db/client';
import type { LookupTableItem, LookupTableKey, LookupTableRow } from '@/types/lookupTable';

export async function upsertLookupTable(
  key: LookupTableKey,
  items: LookupTableItem[],
  syncedAt: string,
): Promise<void> {
  if (items.length === 0) return;
  const db = await getDb();
  for (const item of items) {
    await db.execute(
      `INSERT INTO lookup_tables (table_key, remote_id, label, synced_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT(table_key, remote_id) DO UPDATE SET
         label=excluded.label, synced_at=excluded.synced_at`,
      [key, item.remoteId, item.label, syncedAt],
    );
  }
}

export async function queryLookupTable(key: LookupTableKey): Promise<LookupTableItem[]> {
  const db = await getDb();
  const rows = await db.select<LookupTableRow[]>(
    `SELECT * FROM lookup_tables WHERE table_key = $1 ORDER BY label COLLATE NOCASE`,
    [key],
  );
  return rows.map((r) => ({ remoteId: r.remote_id, label: r.label }));
}

export async function queryLookupTableId(
  key: LookupTableKey,
  label: string,
): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ remote_id: string }[]>(
    `SELECT remote_id FROM lookup_tables WHERE table_key=$1 AND label=$2 COLLATE NOCASE LIMIT 1`,
    [key, label],
  );
  return rows[0]?.remote_id ?? null;
}

export async function queryAllLookupTables(): Promise<Record<string, LookupTableItem[]>> {
  const db = await getDb();
  const rows = await db.select<LookupTableRow[]>(
    `SELECT * FROM lookup_tables ORDER BY table_key, label COLLATE NOCASE`,
  );
  const result: Record<string, LookupTableItem[]> = {};
  for (const row of rows) {
    if (!result[row.table_key]) result[row.table_key] = [];
    result[row.table_key].push({ remoteId: row.remote_id, label: row.label });
  }
  return result;
}
