import { getDb } from '@/lib/db/client';
import type { SavedQuery } from '@/types/admin';

interface SavedQueryRow {
  id: number;
  name: string;
  sql: string;
  created_at: string;
  updated_at: string;
}

function rowToSavedQuery(row: SavedQueryRow): SavedQuery {
  return {
    id: row.id,
    name: row.name,
    sql: row.sql,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function querySavedQueries(): Promise<SavedQuery[]> {
  const db = await getDb();
  const rows = await db.select<SavedQueryRow[]>(
    `SELECT id, name, sql, created_at, updated_at FROM saved_queries ORDER BY updated_at DESC`
  );
  return rows.map(rowToSavedQuery);
}

export async function insertSavedQuery(name: string, sql: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO saved_queries (name, sql) VALUES ($1, $2)`,
    [name, sql]
  );
}

export async function updateSavedQuery(id: number, name: string, sql: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE saved_queries SET name = $1, sql = $2, updated_at = datetime('now') WHERE id = $3`,
    [name, sql, id]
  );
}

export async function deleteSavedQuery(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM saved_queries WHERE id = $1`, [id]);
}
