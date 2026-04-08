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
    title: row.title ?? null,
    lastActiveAt: row.last_active_at,
    profilePhoto: row.profile_photo ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertUser(user: CrmUser): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO users (id, email, name, role, business_unit, title, last_active_at, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT(id) DO UPDATE SET
       email=excluded.email, name=excluded.name, role=excluded.role,
       business_unit=excluded.business_unit, title=excluded.title,
       last_active_at=excluded.last_active_at, updated_at=excluded.updated_at`,
    [user.id, user.email, user.name, user.role, user.businessUnit, user.title, user.lastActiveAt, user.createdAt, user.updatedAt]
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

export async function queryD365UserIdByEmail(email: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ id: string }[]>(
    `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email]
  );
  return rows[0]?.id ?? null;
}

export async function bulkUpsertUsers(users: CrmUser[]): Promise<void> {
  for (const user of users) {
    await upsertUser(user);
  }
}

export async function saveProfilePhoto(userId: string, base64Photo: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE users SET profile_photo = $1, updated_at = datetime('now') WHERE id = $2`,
    [base64Photo, userId]
  );
}

export async function getProfilePhoto(userId: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ profile_photo: string | null }[]>(
    `SELECT profile_photo FROM users WHERE id = $1`,
    [userId]
  );
  return rows[0]?.profile_photo ?? null;
}
