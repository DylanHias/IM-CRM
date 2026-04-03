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
    syncedAt: row.synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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

export async function upsertContact(contact: Contact): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO contacts (
      id, customer_id, first_name, last_name, job_title, email, phone, mobile, notes, contact_type, synced_at, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT(id) DO UPDATE SET
      first_name=excluded.first_name, last_name=excluded.last_name,
      job_title=excluded.job_title, email=excluded.email, phone=excluded.phone,
      mobile=excluded.mobile, notes=excluded.notes, contact_type=excluded.contact_type,
      synced_at=excluded.synced_at, updated_at=excluded.updated_at`,
    [
      contact.id, contact.customerId, contact.firstName, contact.lastName,
      contact.jobTitle, contact.email, contact.phone, contact.mobile,
      contact.notes, contact.contactType, contact.syncedAt, contact.createdAt, contact.updatedAt,
    ]
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
      id, customer_id, first_name, last_name, job_title, email, phone, mobile, notes, contact_type, synced_at, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT(id) DO UPDATE SET
      first_name=excluded.first_name, last_name=excluded.last_name,
      job_title=excluded.job_title, email=excluded.email, phone=excluded.phone,
      mobile=excluded.mobile, notes=excluded.notes, contact_type=excluded.contact_type,
      synced_at=excluded.synced_at, updated_at=excluded.updated_at
    WHERE excluded.updated_at > contacts.updated_at
       OR contacts.updated_at IS NULL`,
    [
      contact.id, contact.customerId, contact.firstName, contact.lastName,
      contact.jobTitle, contact.email, contact.phone, contact.mobile,
      contact.notes, contact.contactType, contact.syncedAt, contact.createdAt, contact.updatedAt,
    ]
  );
  return result.rowsAffected > 0;
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
