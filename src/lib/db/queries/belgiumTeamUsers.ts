import { getDb } from '@/lib/db/client';
import type { BelgiumTeamUserRow } from '@/types/db';

export interface BelgiumTeamUser {
  id: string;
  name: string;
  email: string | null;
  jobTitle: string | null;
}

function rowToUser(row: BelgiumTeamUserRow): BelgiumTeamUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    jobTitle: row.job_title,
  };
}

export async function queryAllBelgiumTeamUsers(): Promise<BelgiumTeamUser[]> {
  const db = await getDb();
  const rows = await db.select<BelgiumTeamUserRow[]>(
    `SELECT * FROM belgium_team_users ORDER BY name COLLATE NOCASE`,
  );
  return rows.map(rowToUser);
}

export async function replaceBelgiumTeamUsers(users: BelgiumTeamUser[]): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(`DELETE FROM belgium_team_users`);
  if (users.length === 0) return;
  for (const u of users) {
    await db.execute(
      `INSERT INTO belgium_team_users (id, name, email, job_title, synced_at) VALUES ($1, $2, $3, $4, $5)`,
      [u.id, u.name, u.email, u.jobTitle, now],
    );
  }
}
