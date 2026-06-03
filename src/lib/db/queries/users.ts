import { getDb } from '@/lib/db/client';
import { isHardcodedAdmin } from '@/lib/auth/adminConfig';
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
    analyticsTracked: !!row.analytics_tracked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertUser(user: CrmUser): Promise<void> {
  const db = await getDb();
  // Note: we deliberately do NOT touch analytics_tracked on upsert — it's a
  // local admin preference that must survive D365 user refreshes.
  await db.execute(
    `INSERT INTO users (id, email, name, role, business_unit, title, last_active_at, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT(id) DO UPDATE SET
       email=excluded.email, name=excluded.name, role=excluded.role,
       business_unit=excluded.business_unit, title=COALESCE(excluded.title, title),
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

export async function touchUserLastActive(id: string, isoTimestamp: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE users SET last_active_at = $1, updated_at = $1 WHERE id = $2`,
    [isoTimestamp, id]
  );
}

export async function setUserAnalyticsTracked(id: string, tracked: boolean): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE users SET analytics_tracked = $1, updated_at = datetime('now') WHERE id = $2`,
    [tracked ? 1 : 0, id]
  );
}

export async function bulkSetAnalyticsTracked(ids: string[], tracked: boolean): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDb();
  const placeholders = ids.map((_, i) => `$${i + 2}`).join(',');
  await db.execute(
    `UPDATE users SET analytics_tracked = $1, updated_at = datetime('now') WHERE id IN (${placeholders})`,
    [tracked ? 1 : 0, ...ids]
  );
}

export async function queryTrackedUserIds(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.select<{ id: string }[]>(`SELECT id FROM users WHERE analytics_tracked = 1`);
  return rows.map((r) => r.id);
}

export { HARDCODED_ADMIN_EMAILS } from '@/lib/auth/adminConfig';
export { isHardcodedAdmin };

export async function isUserAdmin(id: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select<{ role: string; email: string }[]>(
    `SELECT role, email FROM users WHERE id = $1`,
    [id]
  );
  if (!rows[0]) return false;
  if (isHardcodedAdmin(rows[0].email)) return true;
  return rows[0].role === 'admin';
}

export async function queryD365UserIdByEmail(email: string): Promise<string | null> {
  const db = await getDb();
  // A stale MSAL-keyed row can coexist with the D365-synced row for the same email.
  // Prefer whichever row actually carries profile data, then the oldest (D365 syncs
  // before the MSAL self-row), so resolution is deterministic instead of LIMIT-1 luck.
  const rows = await db.select<{ id: string }[]>(
    `SELECT id FROM users WHERE LOWER(email) = LOWER($1)
     ORDER BY
       (birthday IS NOT NULL OR job_title IS NOT NULL OR country IS NOT NULL
         OR city IS NOT NULL OR office_location IS NOT NULL) DESC,
       created_at ASC
     LIMIT 1`,
    [email]
  );
  return rows[0]?.id ?? null;
}

// The local user row is usually keyed by the D365 systemuserid (synced from D365),
// not the MSAL localAccountId. Profile/birthday writes must target that same id or
// they silently update zero rows. Resolve the effective DB id here.
export async function resolveUserDbId(
  localAccountId: string,
  email: string | null | undefined
): Promise<string> {
  if (!email) return localAccountId;
  const existing = await queryD365UserIdByEmail(email);
  return existing ?? localAccountId;
}

export async function bulkUpsertUsers(users: CrmUser[]): Promise<void> {
  const db = await getDb();
  for (const user of users) {
    // Merge any pre-existing row that shares this user's email but has a different
    // ID (typically the MSAL-inserted "self" row, which uses a different GUID than
    // D365's systemuserid). Preserve its analytics_tracked preference and drop it
    // so we don't end up with the same person twice in the admin list.
    if (user.email) {
      const conflicts = await db.select<{ id: string; analytics_tracked: number }[]>(
        `SELECT id, analytics_tracked FROM users WHERE LOWER(email) = LOWER($1) AND id <> $2`,
        [user.email, user.id]
      );
      if (conflicts.length > 0) {
        const preservedTracked = conflicts.some((c) => !!c.analytics_tracked);
        for (const c of conflicts) {
          await db.execute(`DELETE FROM users WHERE id = $1`, [c.id]);
        }
        await upsertUser(user);
        if (preservedTracked) {
          await setUserAnalyticsTracked(user.id, true);
        }
        continue;
      }
    }
    await upsertUser(user);
  }
}

export async function saveUserBirthday(userId: string, isoDate: string | null): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE users SET birthday = $1, updated_at = datetime('now') WHERE id = $2`,
    [isoDate, userId]
  );
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

export interface CachedGraphProfile {
  jobTitle: string | null;
  country: string | null;
  city: string | null;
  officeLocation: string | null;
  birthday: string | null;
}

export async function saveGraphProfile(userId: string, profile: CachedGraphProfile): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE users SET
       job_title = $1,
       country = $2,
       city = $3,
       office_location = $4,
       birthday = $5,
       updated_at = datetime('now')
     WHERE id = $6`,
    [profile.jobTitle, profile.country, profile.city, profile.officeLocation, profile.birthday, userId]
  );
}

export async function getGraphProfile(userId: string): Promise<CachedGraphProfile | null> {
  const db = await getDb();
  const rows = await db.select<{
    job_title: string | null;
    country: string | null;
    city: string | null;
    office_location: string | null;
    birthday: string | null;
  }[]>(
    `SELECT job_title, country, city, office_location, birthday FROM users WHERE id = $1`,
    [userId]
  );
  const row = rows[0];
  if (!row) return null;
  const empty = !row.job_title && !row.country && !row.city && !row.office_location && !row.birthday;
  if (empty) return null;
  return {
    jobTitle: row.job_title,
    country: row.country,
    city: row.city,
    officeLocation: row.office_location,
    birthday: row.birthday,
  };
}
