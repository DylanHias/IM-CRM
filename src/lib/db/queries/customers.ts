import { getDb } from '@/lib/db/client';
import type { Customer } from '@/types/entities';
import type { CustomerRow } from '@/types/db';
import { logAudit } from '@/lib/db/auditHelper';

function rowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    accountNumber: row.account_number,
    bcn: row.bcn,
    resellerId: row.reseller_id,
    industry: row.industry,
    segment: row.segment,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    phone: row.phone,
    email: row.email,
    addressStreet: row.address_street,
    addressCity: row.address_city,
    addressCountry: row.address_country,
    website: row.website,
    cloudCustomer: row.cloud_customer === 1 ? true : row.cloud_customer === 0 ? false : null,
    language: row.language,
    arr: row.arr,
    status: (row.status as Customer['status']) ?? 'active',
    lastActivityAt: row.last_activity_at,
    syncedAt: row.synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function queryAllCustomers(): Promise<Customer[]> {
  const db = await getDb();
  const rows = await db.select<CustomerRow[]>(
    `SELECT * FROM customers ORDER BY name COLLATE NOCASE`
  );
  return rows.map(rowToCustomer);
}

export async function queryCustomerById(id: string): Promise<Customer | null> {
  const db = await getDb();
  const rows = await db.select<CustomerRow[]>(
    `SELECT * FROM customers WHERE id = $1`,
    [id]
  );
  return rows[0] ? rowToCustomer(rows[0]) : null;
}

export async function upsertCustomer(customer: Customer): Promise<void> {
  const db = await getDb();
  const existing = await db.select<CustomerRow[]>(`SELECT * FROM customers WHERE id = $1`, [customer.id]);
  const isUpdate = existing.length > 0;

  await db.execute(
    `INSERT INTO customers (
      id, name, account_number, industry, segment, owner_id, owner_name,
      phone, email, address_street, address_city, address_country, website,
      reseller_id, bcn, cloud_customer, language, arr,
      status, last_activity_at, synced_at, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, account_number=excluded.account_number,
      industry=excluded.industry, segment=excluded.segment,
      owner_id=excluded.owner_id, owner_name=excluded.owner_name,
      phone=excluded.phone, email=excluded.email,
      address_street=excluded.address_street, address_city=excluded.address_city,
      address_country=excluded.address_country, website=excluded.website,
      reseller_id=excluded.reseller_id, bcn=excluded.bcn,
      cloud_customer=excluded.cloud_customer, language=excluded.language, arr=excluded.arr,
      status=excluded.status, synced_at=excluded.synced_at,
      updated_at=excluded.updated_at`,
    [
      customer.id, customer.name, customer.accountNumber, customer.industry,
      customer.segment, customer.ownerId, customer.ownerName, customer.phone,
      customer.email, customer.addressStreet, customer.addressCity,
      customer.addressCountry, customer.website, customer.resellerId, customer.bcn,
      customer.cloudCustomer ? 1 : 0, customer.language, customer.arr, customer.status,
      customer.lastActivityAt, customer.syncedAt, customer.createdAt, customer.updatedAt,
    ]
  );

  if (isUpdate) {
    const old = rowToCustomer(existing[0]);
    const changes: Record<string, unknown> = {};
    const oldVals: Record<string, unknown> = {};
    if (old.name !== customer.name) { oldVals.name = old.name; changes.name = customer.name; }
    if (old.phone !== customer.phone) { oldVals.phone = old.phone; changes.phone = customer.phone; }
    if (old.email !== customer.email) { oldVals.email = old.email; changes.email = customer.email; }
    if (old.industry !== customer.industry) { oldVals.industry = old.industry; changes.industry = customer.industry; }
    if (old.arr !== customer.arr) { oldVals.arr = old.arr; changes.arr = customer.arr; }
    if (Object.keys(changes).length > 0) {
      logAudit('customer', customer.id, 'update', 'system', 'System (sync)', oldVals, changes);
    }
  } else {
    logAudit('customer', customer.id, 'create', 'system', 'System (sync)', null, { name: customer.name });
  }
}

/** Returns true if the record was actually inserted or updated, false if skipped (unchanged). */
export async function upsertCustomerBulk(customer: Customer): Promise<boolean> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO customers (
      id, name, account_number, industry, segment, owner_id, owner_name,
      phone, email, address_street, address_city, address_country, website,
      reseller_id, bcn, cloud_customer, language, arr,
      status, last_activity_at, synced_at, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, account_number=excluded.account_number,
      industry=excluded.industry, segment=excluded.segment,
      owner_id=excluded.owner_id, owner_name=excluded.owner_name,
      phone=excluded.phone, email=excluded.email,
      address_street=excluded.address_street, address_city=excluded.address_city,
      address_country=excluded.address_country, website=excluded.website,
      reseller_id=excluded.reseller_id, bcn=excluded.bcn,
      cloud_customer=excluded.cloud_customer, language=excluded.language, arr=excluded.arr,
      status=excluded.status, synced_at=excluded.synced_at,
      last_activity_at=MAX(COALESCE(customers.last_activity_at,''), COALESCE(excluded.last_activity_at,'')),
      updated_at=excluded.updated_at
    WHERE excluded.updated_at > customers.updated_at
       OR customers.updated_at IS NULL`,
    [
      customer.id, customer.name, customer.accountNumber, customer.industry,
      customer.segment, customer.ownerId, customer.ownerName, customer.phone,
      customer.email, customer.addressStreet, customer.addressCity,
      customer.addressCountry, customer.website, customer.resellerId, customer.bcn,
      customer.cloudCustomer ? 1 : 0, customer.language, customer.arr, customer.status,
      customer.lastActivityAt, customer.syncedAt, customer.createdAt, customer.updatedAt,
    ]
  );
  return result.rowsAffected > 0;
}

export async function updateCustomerLastActivity(customerId: string, at: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE customers SET last_activity_at = $1, updated_at = $2 WHERE id = $3`,
    [at, new Date().toISOString(), customerId]
  );
}

/** Recompute last_activity_at for all customers based on actual activities and contact changes. */
export async function recomputeLastActivityDates(): Promise<void> {
  const db = await getDb();
  await db.execute(`
    UPDATE customers SET last_activity_at = (
      SELECT MAX(dt) FROM (
        SELECT MAX(occurred_at) AS dt FROM activities WHERE customer_id = customers.id
        UNION ALL
        SELECT MAX(updated_at) AS dt FROM contacts WHERE customer_id = customers.id
      )
    )
  `);
}

export async function queryUniqueOwners(): Promise<{ id: string; name: string }[]> {
  const db = await getDb();
  const rows = await db.select<{ owner_id: string; owner_name: string }[]>(
    `SELECT DISTINCT owner_id, owner_name FROM customers WHERE owner_id IS NOT NULL ORDER BY owner_name`
  );
  return rows.map((r) => ({ id: r.owner_id, name: r.owner_name }));
}
