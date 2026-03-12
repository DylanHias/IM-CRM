import { getDb } from '@/lib/db/client';
import type { Customer } from '@/types/entities';
import type { CustomerRow } from '@/types/db';

function rowToCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    accountNumber: row.account_number,
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
  await db.execute(
    `INSERT INTO customers (
      id, name, account_number, industry, segment, owner_id, owner_name,
      phone, email, address_street, address_city, address_country, website,
      status, last_activity_at, synced_at, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, account_number=excluded.account_number,
      industry=excluded.industry, segment=excluded.segment,
      owner_id=excluded.owner_id, owner_name=excluded.owner_name,
      phone=excluded.phone, email=excluded.email,
      address_street=excluded.address_street, address_city=excluded.address_city,
      address_country=excluded.address_country, website=excluded.website,
      status=excluded.status, synced_at=excluded.synced_at,
      updated_at=excluded.updated_at`,
    [
      customer.id, customer.name, customer.accountNumber, customer.industry,
      customer.segment, customer.ownerId, customer.ownerName, customer.phone,
      customer.email, customer.addressStreet, customer.addressCity,
      customer.addressCountry, customer.website, customer.status,
      customer.lastActivityAt, customer.syncedAt, customer.createdAt, customer.updatedAt,
    ]
  );
}

export async function updateCustomerLastActivity(customerId: string, at: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE customers SET last_activity_at = $1, updated_at = $2 WHERE id = $3`,
    [at, new Date().toISOString(), customerId]
  );
}

export async function queryUniqueOwners(): Promise<{ id: string; name: string }[]> {
  const db = await getDb();
  const rows = await db.select<{ owner_id: string; owner_name: string }[]>(
    `SELECT DISTINCT owner_id, owner_name FROM customers WHERE owner_id IS NOT NULL ORDER BY owner_name`
  );
  return rows.map((r) => ({ id: r.owner_id, name: r.owner_name }));
}
