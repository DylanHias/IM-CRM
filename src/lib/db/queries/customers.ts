import { getDb } from '@/lib/db/client';
import type { Customer } from '@/types/entities';
import type { CustomerRow } from '@/types/db';


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
    customerSuccessManagerId: row.customer_success_manager_id,
    customerSuccessManagerName: row.customer_success_manager_name,
    awsOwnerId: row.aws_owner_id,
    awsOwnerName: row.aws_owner_name,
    azureOwnerId: row.azure_owner_id,
    azureOwnerName: row.azure_owner_name,
    accountManagerId: row.account_manager_id,
    accountManagerName: row.account_manager_name,
    mpnId: row.mpn_id,
    apnId: row.apn_id,
    phone: row.phone,
    email: row.email,
    addressStreet: row.address_street,
    addressCity: row.address_city,
    addressCountry: row.address_country,
    website: row.website,
    cloudCustomer: row.cloud_customer === 1 ? true : row.cloud_customer === 0 ? false : null,
    arr: row.arr,
    arrCurrency: row.arr_currency,
    status: (row.status as Customer['status']) ?? 'active',
    lastActivityAt: row.last_activity_at,
    healthScore: row.health_score,
    syncedAt: row.synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function queryAllCustomerIds(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.select<{ id: string }[]>(`SELECT id FROM customers`);
  return new Set(rows.map((r) => r.id));
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
      reseller_id, bcn, cloud_customer, arr,
      status, last_activity_at, synced_at, created_at, updated_at,
      customer_success_manager_id, customer_success_manager_name,
      aws_owner_id, aws_owner_name, azure_owner_id, azure_owner_name,
      account_manager_id, account_manager_name,
      mpn_id, apn_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, account_number=excluded.account_number,
      industry=excluded.industry, segment=excluded.segment,
      owner_id=excluded.owner_id, owner_name=excluded.owner_name,
      phone=excluded.phone, email=excluded.email,
      address_street=excluded.address_street, address_city=excluded.address_city,
      address_country=excluded.address_country, website=excluded.website,
      reseller_id=excluded.reseller_id, bcn=excluded.bcn,
      status=excluded.status, synced_at=excluded.synced_at,
      customer_success_manager_id=excluded.customer_success_manager_id,
      customer_success_manager_name=excluded.customer_success_manager_name,
      aws_owner_id=excluded.aws_owner_id,
      aws_owner_name=excluded.aws_owner_name,
      azure_owner_id=excluded.azure_owner_id,
      azure_owner_name=excluded.azure_owner_name,
      account_manager_id=excluded.account_manager_id,
      account_manager_name=excluded.account_manager_name,
      mpn_id=excluded.mpn_id,
      apn_id=excluded.apn_id,
      updated_at=excluded.updated_at`,
    [
      customer.id, customer.name, customer.accountNumber, customer.industry,
      customer.segment, customer.ownerId, customer.ownerName, customer.phone,
      customer.email, customer.addressStreet, customer.addressCity,
      customer.addressCountry, customer.website, customer.resellerId, customer.bcn,
      null, customer.arr, customer.status,
      customer.lastActivityAt, customer.syncedAt, customer.createdAt, customer.updatedAt,
      customer.customerSuccessManagerId, customer.customerSuccessManagerName,
      customer.awsOwnerId, customer.awsOwnerName, customer.azureOwnerId, customer.azureOwnerName,
      customer.accountManagerId, customer.accountManagerName,
      customer.mpnId, customer.apnId,
    ]
  );

}

/** Returns true if the record was actually inserted or updated, false if skipped (unchanged). */
export async function upsertCustomerBulk(customer: Customer): Promise<boolean> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO customers (
      id, name, account_number, industry, segment, owner_id, owner_name,
      phone, email, address_street, address_city, address_country, website,
      reseller_id, bcn, cloud_customer, arr,
      status, last_activity_at, synced_at, created_at, updated_at,
      customer_success_manager_id, customer_success_manager_name,
      aws_owner_id, aws_owner_name, azure_owner_id, azure_owner_name,
      account_manager_id, account_manager_name,
      mpn_id, apn_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, account_number=excluded.account_number,
      industry=excluded.industry, segment=excluded.segment,
      owner_id=excluded.owner_id, owner_name=excluded.owner_name,
      phone=excluded.phone, email=excluded.email,
      address_street=excluded.address_street, address_city=excluded.address_city,
      address_country=excluded.address_country, website=excluded.website,
      reseller_id=excluded.reseller_id, bcn=excluded.bcn,
      status=excluded.status, synced_at=excluded.synced_at,
      customer_success_manager_id=excluded.customer_success_manager_id,
      customer_success_manager_name=excluded.customer_success_manager_name,
      aws_owner_id=excluded.aws_owner_id,
      aws_owner_name=excluded.aws_owner_name,
      azure_owner_id=excluded.azure_owner_id,
      azure_owner_name=excluded.azure_owner_name,
      account_manager_id=excluded.account_manager_id,
      account_manager_name=excluded.account_manager_name,
      mpn_id=excluded.mpn_id,
      apn_id=excluded.apn_id,
      last_activity_at=MAX(COALESCE(customers.last_activity_at,''), COALESCE(excluded.last_activity_at,'')),
      updated_at=excluded.updated_at
    WHERE excluded.updated_at > customers.updated_at
       OR customers.updated_at IS NULL`,
    [
      customer.id, customer.name, customer.accountNumber, customer.industry,
      customer.segment, customer.ownerId, customer.ownerName, customer.phone,
      customer.email, customer.addressStreet, customer.addressCity,
      customer.addressCountry, customer.website, customer.resellerId, customer.bcn,
      null, customer.arr, customer.status,
      customer.lastActivityAt, customer.syncedAt, customer.createdAt, customer.updatedAt,
      customer.customerSuccessManagerId, customer.customerSuccessManagerName,
      customer.awsOwnerId, customer.awsOwnerName, customer.azureOwnerId, customer.azureOwnerName,
      customer.accountManagerId, customer.accountManagerName,
      customer.mpnId, customer.apnId,
    ]
  );
  return result.rowsAffected > 0;
}

export async function updateCustomerLastActivity(customerId: string, at: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE customers SET last_activity_at = MAX(COALESCE(last_activity_at, ''), $1), updated_at = $2 WHERE id = $3`,
    [at, new Date().toISOString(), customerId]
  );
}

/** Derive cloud_customer from contacts: true if ANY contact has contact_type 'Cloud Reseller'/'Cloud Contact' or cloud_contact = 1. */
export async function recomputeCloudCustomerStatus(): Promise<void> {
  const db = await getDb();
  await db.execute(`
    UPDATE customers SET cloud_customer = (
      SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END
      FROM contacts
      WHERE contacts.customer_id = customers.id
        AND (contact_type IN ('Cloud Reseller', 'Cloud Contact') OR cloud_contact = 1)
    )
  `);
}

/** Recompute health_score for all customers: weighted sum of recency (40%), open-opportunity pipeline (30%), and 90-day activity frequency (30%). */
export async function recomputeCustomerHealthScores(): Promise<void> {
  const db = await getDb();
  await db.execute(`
    UPDATE customers SET health_score = CAST(ROUND(
      0.4 * (
        CASE
          WHEN last_activity_at IS NULL THEN 0
          WHEN (julianday('now') - julianday(last_activity_at)) <= 7  THEN 100
          WHEN (julianday('now') - julianday(last_activity_at)) <= 14 THEN 85
          WHEN (julianday('now') - julianday(last_activity_at)) <= 30 THEN 65
          WHEN (julianday('now') - julianday(last_activity_at)) <= 60 THEN 35
          WHEN (julianday('now') - julianday(last_activity_at)) <= 90 THEN 15
          ELSE 0
        END
      )
      + 0.3 * (
        CASE (SELECT COUNT(*) FROM opportunities WHERE customer_id = customers.id AND status = 'Open')
          WHEN 0 THEN 10
          WHEN 1 THEN 55
          WHEN 2 THEN 75
          WHEN 3 THEN 90
          ELSE 100
        END
      )
      + 0.3 * (
        CASE
          WHEN (SELECT COUNT(*) FROM activities WHERE customer_id = customers.id AND occurred_at >= datetime('now', '-90 days') AND occurred_at <= datetime('now')) = 0 THEN 0
          WHEN (SELECT COUNT(*) FROM activities WHERE customer_id = customers.id AND occurred_at >= datetime('now', '-90 days') AND occurred_at <= datetime('now')) <= 2 THEN 40
          WHEN (SELECT COUNT(*) FROM activities WHERE customer_id = customers.id AND occurred_at >= datetime('now', '-90 days') AND occurred_at <= datetime('now')) <= 5 THEN 70
          WHEN (SELECT COUNT(*) FROM activities WHERE customer_id = customers.id AND occurred_at >= datetime('now', '-90 days') AND occurred_at <= datetime('now')) <= 9 THEN 90
          ELSE 100
        END
      )
    ) AS INTEGER)
  `);
}

/** Recompute health_score for a single customer. Same formula as recomputeCustomerHealthScores. */
export async function recomputeCustomerHealthScore(customerId: string): Promise<void> {
  const db = await getDb();
  await db.execute(`
    UPDATE customers SET health_score = CAST(ROUND(
      0.4 * (
        CASE
          WHEN last_activity_at IS NULL THEN 0
          WHEN (julianday('now') - julianday(last_activity_at)) <= 7  THEN 100
          WHEN (julianday('now') - julianday(last_activity_at)) <= 14 THEN 85
          WHEN (julianday('now') - julianday(last_activity_at)) <= 30 THEN 65
          WHEN (julianday('now') - julianday(last_activity_at)) <= 60 THEN 35
          WHEN (julianday('now') - julianday(last_activity_at)) <= 90 THEN 15
          ELSE 0
        END
      )
      + 0.3 * (
        CASE (SELECT COUNT(*) FROM opportunities WHERE customer_id = customers.id AND status = 'Open')
          WHEN 0 THEN 10
          WHEN 1 THEN 55
          WHEN 2 THEN 75
          WHEN 3 THEN 90
          ELSE 100
        END
      )
      + 0.3 * (
        CASE
          WHEN (SELECT COUNT(*) FROM activities WHERE customer_id = customers.id AND occurred_at >= datetime('now', '-90 days') AND occurred_at <= datetime('now')) = 0 THEN 0
          WHEN (SELECT COUNT(*) FROM activities WHERE customer_id = customers.id AND occurred_at >= datetime('now', '-90 days') AND occurred_at <= datetime('now')) <= 2 THEN 40
          WHEN (SELECT COUNT(*) FROM activities WHERE customer_id = customers.id AND occurred_at >= datetime('now', '-90 days') AND occurred_at <= datetime('now')) <= 5 THEN 70
          WHEN (SELECT COUNT(*) FROM activities WHERE customer_id = customers.id AND occurred_at >= datetime('now', '-90 days') AND occurred_at <= datetime('now')) <= 9 THEN 90
          ELSE 100
        END
      )
    ) AS INTEGER) WHERE id = $1
  `, [customerId]);
}

/** Recompute last_activity_at for all customers based on actual activities and contact changes. */
export async function recomputeLastActivityDates(): Promise<void> {
  const db = await getDb();
  await db.execute(`
    UPDATE customers SET last_activity_at = (
      SELECT MAX(dt) FROM (
        SELECT MAX(occurred_at) AS dt FROM activities WHERE customer_id = customers.id AND occurred_at <= datetime('now')
        UNION ALL
        SELECT MAX(updated_at) AS dt FROM contacts WHERE customer_id = customers.id
      )
    )
  `);
}

export async function queryFavoriteCustomerIds(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db.select<{ customer_id: string }[]>(
    `SELECT customer_id FROM customer_favorites`
  );
  return new Set(rows.map((r) => r.customer_id));
}

export async function addCustomerFavorite(customerId: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT OR IGNORE INTO customer_favorites (customer_id) VALUES ($1)`,
    [customerId]
  );
}

export async function removeCustomerFavorite(customerId: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `DELETE FROM customer_favorites WHERE customer_id = $1`,
    [customerId]
  );
}

/** Multi-value INSERT for bulk sync. Returns total rows changed. */
export async function bulkUpsertCustomers(customers: Customer[]): Promise<number> {
  if (customers.length === 0) return 0;
  const db = await getDb();
  const COLS = 30;
  const CHUNK = Math.floor(999 / COLS); // ~33 rows per batch
  let changed = 0;

  for (let i = 0; i < customers.length; i += CHUNK) {
    const chunk = customers.slice(i, i + CHUNK);
    const placeholders = chunk
      .map((_, j) => `(${Array.from({ length: COLS }, (__, k) => `$${j * COLS + k + 1}`).join(',')})`)
      .join(',');
    const values = chunk.flatMap((c) => [
      c.id, c.name, c.accountNumber, c.industry,
      c.segment, c.ownerId, c.ownerName, c.phone,
      c.email, c.addressStreet, c.addressCity,
      c.addressCountry, c.website, c.resellerId, c.bcn,
      null, c.arr, c.status,
      c.lastActivityAt, c.syncedAt, c.createdAt, c.updatedAt,
      c.customerSuccessManagerId, c.customerSuccessManagerName,
      c.awsOwnerId, c.awsOwnerName, c.azureOwnerId, c.azureOwnerName,
      c.mpnId, c.apnId,
    ]);
    const result = await db.execute(
      `INSERT INTO customers (
        id, name, account_number, industry, segment, owner_id, owner_name,
        phone, email, address_street, address_city, address_country, website,
        reseller_id, bcn, cloud_customer, arr,
        status, last_activity_at, synced_at, created_at, updated_at,
        customer_success_manager_id, customer_success_manager_name,
        aws_owner_id, aws_owner_name, azure_owner_id, azure_owner_name,
        mpn_id, apn_id
      ) VALUES ${placeholders}
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name, account_number=excluded.account_number,
        industry=excluded.industry, segment=excluded.segment,
        owner_id=excluded.owner_id, owner_name=excluded.owner_name,
        phone=excluded.phone, email=excluded.email,
        address_street=excluded.address_street, address_city=excluded.address_city,
        address_country=excluded.address_country, website=excluded.website,
        reseller_id=excluded.reseller_id, bcn=excluded.bcn,
        status=excluded.status, synced_at=excluded.synced_at,
        customer_success_manager_id=excluded.customer_success_manager_id,
        customer_success_manager_name=excluded.customer_success_manager_name,
        aws_owner_id=excluded.aws_owner_id,
        aws_owner_name=excluded.aws_owner_name,
        azure_owner_id=excluded.azure_owner_id,
        azure_owner_name=excluded.azure_owner_name,
        mpn_id=excluded.mpn_id,
        apn_id=excluded.apn_id,
        last_activity_at=MAX(COALESCE(customers.last_activity_at,''), COALESCE(excluded.last_activity_at,'')),
        updated_at=excluded.updated_at
      WHERE excluded.updated_at > customers.updated_at OR customers.updated_at IS NULL`,
      values,
    );
    changed += result.rowsAffected;
  }
  return changed;
}

export interface CloudOwnerUpdate {
  customerSuccessManagerId: string | null;
  customerSuccessManagerName: string | null;
  awsOwnerId: string | null;
  awsOwnerName: string | null;
  azureOwnerId: string | null;
  azureOwnerName: string | null;
  accountManagerId: string | null;
  accountManagerName: string | null;
}

/** Updates the four cloud-services owner lookups on a customer. */
export async function updateCustomerCloudOwners(customerId: string, update: CloudOwnerUpdate): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE customers SET
      customer_success_manager_id = $1,
      customer_success_manager_name = $2,
      aws_owner_id = $3,
      aws_owner_name = $4,
      azure_owner_id = $5,
      azure_owner_name = $6,
      account_manager_id = $7,
      account_manager_name = $8,
      updated_at = $9
     WHERE id = $10`,
    [
      update.customerSuccessManagerId, update.customerSuccessManagerName,
      update.awsOwnerId, update.awsOwnerName,
      update.azureOwnerId, update.azureOwnerName,
      update.accountManagerId, update.accountManagerName,
      new Date().toISOString(), customerId,
    ],
  );
}

export interface VendorIdsUpdate {
  mpnId: string | null;
  apnId: string | null;
}

/** Updates the MPN ID and APN ID text fields on a customer. */
export async function updateCustomerVendorIds(customerId: string, update: VendorIdsUpdate): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE customers SET
      mpn_id = $1,
      apn_id = $2,
      updated_at = $3
     WHERE id = $4`,
    [update.mpnId, update.apnId, new Date().toISOString(), customerId],
  );
}

export interface ArrUpdate {
  bcn: string;
  arr: number;
  currency: string | null;
}

/** Updates arr + arr_currency on matching customer rows keyed by BCN. Returns rows changed. */
export async function bulkUpdateCustomerArrByBcn(entries: ArrUpdate[]): Promise<number> {
  if (entries.length === 0) return 0;
  const db = await getDb();
  const now = new Date().toISOString();
  let changed = 0;
  const CHUNK = 200;
  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    for (const e of chunk) {
      const result = await db.execute(
        `UPDATE customers
         SET arr = $1, arr_currency = $2, updated_at = $3
         WHERE bcn = $4`,
        [e.arr, e.currency, now, e.bcn],
      );
      changed += result.rowsAffected;
    }
  }
  return changed;
}

/** Clears arr + arr_currency for any customer whose BCN is not in the provided set. Returns rows changed. */
export async function clearStaleCustomerArr(freshBcns: Set<string>): Promise<number> {
  const db = await getDb();
  const rows = await db.select<{ bcn: string }[]>(
    `SELECT bcn FROM customers WHERE arr IS NOT NULL AND bcn IS NOT NULL`,
  );
  const now = new Date().toISOString();
  let changed = 0;
  for (const { bcn } of rows) {
    if (!freshBcns.has(bcn)) {
      const result = await db.execute(
        `UPDATE customers SET arr = NULL, arr_currency = NULL, updated_at = $1 WHERE bcn = $2`,
        [now, bcn],
      );
      changed += result.rowsAffected;
    }
  }
  return changed;
}

export async function queryUniqueOwners(): Promise<{ id: string; name: string }[]> {
  const db = await getDb();
  const rows = await db.select<{ owner_id: string; owner_name: string }[]>(
    `SELECT DISTINCT owner_id, owner_name FROM customers WHERE owner_id IS NOT NULL ORDER BY owner_name`
  );
  return rows.map((r) => ({ id: r.owner_id, name: r.owner_name }));
}
