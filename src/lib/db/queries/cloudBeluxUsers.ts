import { getDb } from '@/lib/db/client';
import type { CloudBeluxUserRow } from '@/types/db';

export interface CloudBeluxUser {
  id: string;
  name: string;
  email: string | null;
  jobTitle: string | null;
}

function rowToUser(row: CloudBeluxUserRow): CloudBeluxUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    jobTitle: row.job_title,
  };
}

export async function queryAllCloudBeluxUsers(): Promise<CloudBeluxUser[]> {
  const db = await getDb();
  const rows = await db.select<CloudBeluxUserRow[]>(
    `SELECT * FROM cloud_belux_users ORDER BY name COLLATE NOCASE`,
  );
  return rows.map(rowToUser);
}

export async function replaceCloudBeluxUsers(users: CloudBeluxUser[]): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(`DELETE FROM cloud_belux_users`);
  if (users.length === 0) return;
  for (const u of users) {
    await db.execute(
      `INSERT INTO cloud_belux_users (id, name, email, job_title, synced_at) VALUES ($1, $2, $3, $4, $5)`,
      [u.id, u.name, u.email, u.jobTitle, now],
    );
  }
}
