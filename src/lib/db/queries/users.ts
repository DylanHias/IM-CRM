import { getDb } from '@/lib/db/client';
import type { CrmUser, UserRole } from '@/types/admin';
import type { UserRow } from '@/types/db';

function rowToUser(row: UserRow): CrmUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as UserRole,
    businessUnit: row.business_unit,
    lastActiveAt: row.last_active_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertUser(user: CrmUser): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO users (id, email, name, role, business_unit, last_active_at, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT(id) DO UPDATE SET
       email=excluded.email, name=excluded.name,
       business_unit=excluded.business_unit, last_active_at=excluded.last_active_at,
       updated_at=excluded.updated_at`,
    [user.id, user.email, user.name, user.role, user.businessUnit, user.lastActiveAt, user.createdAt, user.updatedAt]
  );
}

export async function queryAllUsers(): Promise<CrmUser[]> {
  const db = await getDb();
  const rows = await db.select<UserRow[]>(`SELECT * FROM users ORDER BY name`);
  return rows.map(rowToUser);
}

export async function updateUserRole(id: string, role: UserRole): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE users SET role = $1, updated_at = datetime('now') WHERE id = $2`,
    [role, id]
  );
}

const HARDCODED_ADMIN_EMAILS = ['dylan.hias@ingrammicro.com'];

export async function isUserAdmin(id: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select<{ role: string; email: string }[]>(
    `SELECT role, email FROM users WHERE id = $1`,
    [id]
  );
  if (!rows[0]) return false;
  if (HARDCODED_ADMIN_EMAILS.includes(rows[0].email.toLowerCase())) return true;
  return rows[0].role === 'admin';
}

export async function bulkUpsertUsers(users: CrmUser[]): Promise<void> {
  for (const user of users) {
    await upsertUser(user);
  }
}
