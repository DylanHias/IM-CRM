import { getDb } from '@/lib/db/client';
import type { Contact } from '@/types/entities';
import type { ContactRow } from '@/types/db';


function rowToContact(row: ContactRow): Contact {
  return {
    id: row.id,
    customerId: row.customer_id,
    firstName: row.first_name,
    lastName: row.last_name,
    jobTitle: row.job_title,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    notes: row.notes,
    contactType: row.contact_type,
    contactTypeId: row.contact_type_id,
    countryId: row.country_id,
    countryName: row.country_name,
    cloudContact: row.cloud_contact === 1 ? true : row.cloud_contact === 0 ? false : null,
    isPrimary: row.is_primary === 1,
    syncStatus: (row.sync_status ?? 'synced') as Contact['syncStatus'],
    remoteId: row.remote_id,
    source: (row.source ?? 'local') as Contact['source'],
    syncedAt: row.synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function queryAllContactIds(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.select<{ id: string }[]>(`SELECT id FROM contacts`);
  return new Set(rows.map((r) => r.id));
}

export async function queryAllContacts(): Promise<Contact[]> {
  const db = await getDb();
  const rows = await db.select<ContactRow[]>(`SELECT * FROM contacts ORDER BY last_name, first_name`);
  return rows.map(rowToContact);
}

export async function queryContactsByCustomer(customerId: string): Promise<Contact[]> {
  const db = await getDb();
  const rows = await db.select<ContactRow[]>(
    `SELECT * FROM contacts WHERE customer_id = $1 ORDER BY last_name, first_name`,
    [customerId]
  );
  return rows.map(rowToContact);
}

export async function queryContactPhone(contactId: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ phone: string | null; mobile: string | null }[]>(
    `SELECT phone, mobile FROM contacts WHERE id = $1`,
    [contactId],
  );
  if (rows.length === 0) return null;
  return rows[0].phone || rows[0].mobile || null;
}

export async function queryContactPushInfo(contactId: string): Promise<{ phone: string | null; remoteId: string | null } | null> {
  const db = await getDb();
  const rows = await db.select<{ phone: string | null; mobile: string | null; remote_id: string | null }[]>(
    `SELECT phone, mobile, remote_id FROM contacts WHERE id = $1`,
    [contactId],
  );
  if (rows.length === 0) return null;
  return {
    phone: rows[0].phone || rows[0].mobile || null,
    remoteId: rows[0].remote_id,
  };
}

export async function upsertContact(contact: Contact): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO contacts (
      id, customer_id, first_name, last_name, job_title, email, phone, mobile, notes, contact_type,
      contact_type_id, country_id, country_name, cloud_contact,
      is_primary, sync_status, remote_id, source, synced_at, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
    ON CONFLICT(id) DO UPDATE SET
      first_name=excluded.first_name, last_name=excluded.last_name,
      job_title=excluded.job_title, email=excluded.email, phone=excluded.phone,
      mobile=excluded.mobile, notes=excluded.notes, contact_type=excluded.contact_type,
      contact_type_id=excluded.contact_type_id, country_id=excluded.country_id, country_name=excluded.country_name,
      cloud_contact=excluded.cloud_contact, is_primary=excluded.is_primary,
      sync_status=excluded.sync_status, remote_id=excluded.remote_id,
      synced_at=excluded.synced_at, updated_at=excluded.updated_at`,
    [
      contact.id, contact.customerId, contact.firstName, contact.lastName,
      contact.jobTitle, contact.email, contact.phone, contact.mobile,
      contact.notes, contact.contactType,
      contact.contactTypeId, contact.countryId, contact.countryName,
      contact.cloudContact === true ? 1 : contact.cloudContact === false ? 0 : null,
      contact.isPrimary ? 1 : 0,
      contact.syncStatus, contact.remoteId, contact.source,
      contact.syncedAt, contact.createdAt, contact.updatedAt,
    ]
  );
}

export async function setPrimaryContact(contactId: string, customerId: string): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE contacts SET is_primary = 0 WHERE customer_id = $1`, [customerId]);
  await db.execute(
    `UPDATE contacts SET is_primary = 1, updated_at = $1 WHERE id = $2`,
    [new Date().toISOString(), contactId],
  );
}

/** Returns true if the record was actually inserted or updated, false if skipped. */
export async function upsertContactBulk(contact: Contact): Promise<boolean> {
  const db = await getDb();
  // Skip contacts whose parent customer doesn't exist locally (e.g. inactive accounts filtered out)
  const parent = await db.select<{ id: string }[]>(
    `SELECT id FROM customers WHERE id = $1`,
    [contact.customerId]
  );
  if (parent.length === 0) return false;

  const result = await db.execute(
    `INSERT INTO contacts (
      id, customer_id, first_name, last_name, job_title, email, phone, mobile, notes, contact_type,
      contact_type_id, country_id, country_name, cloud_contact,
      is_primary, sync_status, remote_id, source, synced_at, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,0,$15,$16,$17,$18,$19,$20)
    ON CONFLICT(id) DO UPDATE SET
      first_name=excluded.first_name, last_name=excluded.last_name,
      job_title=excluded.job_title, email=excluded.email, phone=excluded.phone,
      mobile=excluded.mobile, notes=excluded.notes, contact_type=excluded.contact_type,
      contact_type_id=excluded.contact_type_id, country_id=excluded.country_id, country_name=excluded.country_name,
      cloud_contact=excluded.cloud_contact,
      sync_status=excluded.sync_status, remote_id=excluded.remote_id,
      synced_at=excluded.synced_at, updated_at=excluded.updated_at
    WHERE (excluded.updated_at > contacts.updated_at OR contacts.updated_at IS NULL)
      AND contacts.sync_status != 'pending'`,
    [
      contact.id, contact.customerId, contact.firstName, contact.lastName,
      contact.jobTitle, contact.email, contact.phone, contact.mobile,
      contact.notes, contact.contactType,
      contact.contactTypeId, contact.countryId, contact.countryName,
      contact.cloudContact === true ? 1 : contact.cloudContact === false ? 0 : null,
      contact.syncStatus, contact.remoteId, contact.source,
      contact.syncedAt, contact.createdAt, contact.updatedAt,
    ]
  );
  return result.rowsAffected > 0;
}

/** Load remote_id → {localId, syncStatus} map for all D365-synced contacts. One query replaces N per-record SELECTs. */
export async function preloadContactState(): Promise<Map<string, { localId: string; syncStatus: string }>> {
  const db = await getDb();
  const rows = await db.select<{ id: string; remote_id: string; sync_status: string }[]>(
    `SELECT id, remote_id, sync_status FROM contacts WHERE remote_id IS NOT NULL`,
  );
  const map = new Map<string, { localId: string; syncStatus: string }>();
  for (const row of rows) {
    map.set(row.remote_id, { localId: row.id, syncStatus: row.sync_status });
  }
  return map;
}

/** Multi-value INSERT for bulk sync. Updates by remote_id when a synced row already exists locally
 *  (preserves the local UUID and the local-only `notes` field). Skips rows with pending local edits. */
export async function bulkUpsertContacts(
  contacts: Contact[],
  customerIdSet: Set<string>,
  existing: Map<string, { localId: string; syncStatus: string }>,
): Promise<number> {
  const filtered = contacts.filter((c) => customerIdSet.has(c.customerId));
  if (filtered.length === 0) return 0;
  const db = await getDb();

  const toInsert: Contact[] = [];
  const toUpdate: Contact[] = [];
  for (const contact of filtered) {
    const prev = contact.remoteId ? existing.get(contact.remoteId) : undefined;
    if (prev) {
      if (prev.syncStatus === 'pending') continue;
      toUpdate.push(contact);
    } else {
      toInsert.push(contact);
    }
  }

  // is_primary excluded — defaults to 0 (NOT NULL DEFAULT 0); not set/overwritten during D365 pull
  const COLS = 20;
  const CHUNK = Math.floor(999 / COLS); // ~49 rows per batch
  let changed = 0;

  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    const placeholders = chunk
      .map((_, j) => `(${Array.from({ length: COLS }, (__, k) => `$${j * COLS + k + 1}`).join(',')})`)
      .join(',');
    const values = chunk.flatMap((c) => [
      c.id, c.customerId, c.firstName, c.lastName,
      c.jobTitle, c.email, c.phone, c.mobile,
      c.notes, c.contactType,
      c.contactTypeId, c.countryId, c.countryName,
      c.cloudContact === true ? 1 : c.cloudContact === false ? 0 : null,
      c.syncStatus, c.remoteId, c.source,
      c.syncedAt, c.createdAt, c.updatedAt,
    ]);
    try {
      const result = await db.execute(
        `INSERT OR IGNORE INTO contacts (
          id, customer_id, first_name, last_name, job_title, email, phone, mobile,
          notes, contact_type, contact_type_id, country_id, country_name,
          cloud_contact, sync_status, remote_id, source,
          synced_at, created_at, updated_at
        ) VALUES ${placeholders}`,
        values,
      );
      changed += result.rowsAffected;
    } catch (err) {
      console.error('[contact] Bulk insert chunk failed:', err instanceof Error ? err.message : err);
    }
  }

  for (const c of toUpdate) {
    try {
      const result = await db.execute(
        `UPDATE contacts SET
           customer_id=$1, first_name=$2, last_name=$3, job_title=$4, email=$5,
           phone=$6, mobile=$7, contact_type=$8, contact_type_id=$9,
           country_id=$10, country_name=$11, cloud_contact=$12,
           sync_status='synced', source='d365', synced_at=$13, updated_at=$14
         WHERE remote_id=$15 AND sync_status != 'pending'`,
        [
          c.customerId, c.firstName, c.lastName, c.jobTitle, c.email,
          c.phone, c.mobile, c.contactType, c.contactTypeId,
          c.countryId, c.countryName,
          c.cloudContact === true ? 1 : c.cloudContact === false ? 0 : null,
          c.syncedAt, c.updatedAt, c.remoteId,
        ],
      );
      changed += result.rowsAffected;
    } catch (err) {
      console.error(`[contact] Failed to update contact ${c.remoteId}:`, err instanceof Error ? err.message : err);
    }
  }

  return changed;
}

export async function deleteContact(id: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM contacts WHERE id=$1`, [id]);
}

export async function updateContactNotes(contactId: string, notes: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE contacts SET notes = $1, updated_at = $2 WHERE id = $3`,
    [notes, new Date().toISOString(), contactId]
  );
}

export async function markContactSynced(id: string, remoteId: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE contacts SET sync_status = 'synced', remote_id = $1 WHERE id = $2`,
    [remoteId, id]
  );
}

export async function markContactSyncError(id: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE contacts SET sync_status = 'error' WHERE id = $1`,
    [id]
  );
}

export async function queryPendingContacts(): Promise<Contact[]> {
  const db = await getDb();
  const rows = await db.select<ContactRow[]>(
    `SELECT * FROM contacts WHERE sync_status = 'pending' ORDER BY created_at`
  );
  return rows.map(rowToContact);
}
