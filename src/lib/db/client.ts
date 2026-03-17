import type Database from '@tauri-apps/plugin-sql';
import { isTauriApp } from '@/lib/utils/offlineUtils';

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { default: SqlDatabase } = await import('@tauri-apps/plugin-sql');
    dbInstance = await SqlDatabase.load('sqlite:crm.db');
    return dbInstance;
  })();

  return initPromise;
}

export async function initDb(): Promise<void> {
  if (!isTauriApp()) {
    console.warn('Not running in Tauri — SQLite unavailable');
    return;
  }
  const db = await getDb();
  await runSchema(db);
  await seedIfNeeded(db);
}

async function runSchema(db: Database): Promise<void> {
  // Check schema version
  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const rows = await db.select<{ value: string }[]>(
    `SELECT value FROM app_settings WHERE key = 'schema_version'`
  );

  if (rows.length > 0) {
    const version = parseInt(rows[0].value, 10);
    await runMigrations(db, version);
    return;
  }

  // Run full schema
  await db.execute(`PRAGMA journal_mode=WAL`);
  await db.execute(`PRAGMA foreign_keys=ON`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      account_number  TEXT,
      industry        TEXT,
      segment         TEXT,
      owner_id        TEXT,
      owner_name      TEXT,
      phone           TEXT,
      email           TEXT,
      address_street  TEXT,
      address_city    TEXT,
      address_country TEXT,
      website         TEXT,
      status          TEXT DEFAULT 'active',
      last_activity_at TEXT,
      synced_at       TEXT NOT NULL,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      reseller_id     TEXT,
      bcn             TEXT,
      cloud_customer  INTEGER,
      language        TEXT,
      arr             REAL,
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_customers_owner ON customers(owner_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name COLLATE NOCASE)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS contacts (
      id            TEXT PRIMARY KEY,
      customer_id   TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      first_name    TEXT NOT NULL,
      last_name     TEXT NOT NULL,
      job_title     TEXT,
      email         TEXT,
      phone         TEXT,
      mobile        TEXT,
      notes         TEXT,
      synced_at     TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_contacts_customer ON contacts(customer_id)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS activities (
      id              TEXT PRIMARY KEY,
      customer_id     TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      contact_id      TEXT REFERENCES contacts(id) ON DELETE SET NULL,
      type            TEXT NOT NULL CHECK(type IN ('meeting','visit','call','note')),
      subject         TEXT NOT NULL,
      description     TEXT,
      occurred_at     TEXT NOT NULL,
      created_by_id   TEXT NOT NULL,
      created_by_name TEXT NOT NULL,
      sync_status     TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending','synced','error')),
      remote_id       TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_activities_customer ON activities(customer_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_activities_occurred ON activities(occurred_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_activities_sync ON activities(sync_status)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS trainings (
      id            TEXT PRIMARY KEY,
      customer_id   TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      title         TEXT NOT NULL,
      training_date TEXT NOT NULL,
      participant   TEXT,
      provider      TEXT,
      status        TEXT,
      synced_at     TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_trainings_customer ON trainings(customer_id)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS follow_ups (
      id              TEXT PRIMARY KEY,
      customer_id     TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      activity_id     TEXT REFERENCES activities(id) ON DELETE SET NULL,
      title           TEXT NOT NULL,
      description     TEXT,
      due_date        TEXT NOT NULL,
      completed       INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1)),
      completed_at    TEXT,
      created_by_id   TEXT NOT NULL,
      created_by_name TEXT NOT NULL,
      sync_status     TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending','synced','error')),
      remote_id       TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_followups_customer ON follow_ups(customer_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_followups_due ON follow_ups(due_date)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      invoice_number          TEXT NOT NULL,
      reseller_id             TEXT NOT NULL,
      PRIMARY KEY (invoice_number, reseller_id),
      invoice_status          TEXT NOT NULL,
      invoice_date            TEXT NOT NULL,
      invoice_due_date        TEXT NOT NULL,
      invoiced_amount_due     REAL NOT NULL,
      invoice_amount_incl_tax REAL NOT NULL,
      customer_order_number   TEXT,
      end_customer_order_number TEXT,
      order_create_date       TEXT,
      erp_order_number        TEXT,
      payment_terms_due_date  TEXT
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_invoices_reseller ON invoices(reseller_id)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoice_lines (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number     TEXT NOT NULL REFERENCES invoices(invoice_number) ON DELETE CASCADE,
      ingram_part_number TEXT,
      vendor_part_number TEXT,
      vendor_name        TEXT,
      product_description TEXT,
      quantity           INTEGER NOT NULL,
      unit_price         REAL NOT NULL,
      extended_price     REAL NOT NULL,
      tax_amount         REAL NOT NULL,
      quantity_ordered   INTEGER,
      quantity_shipped   INTEGER,
      currency_code      TEXT DEFAULT 'EUR'
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_number)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_records (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_type      TEXT NOT NULL CHECK(sync_type IN ('d365','training','push_activities','push_followups')),
      status         TEXT NOT NULL CHECK(status IN ('running','success','partial','error')),
      started_at     TEXT NOT NULL,
      finished_at    TEXT,
      records_pulled INTEGER DEFAULT 0,
      records_pushed INTEGER DEFAULT 0,
      error_message  TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(
    `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('schema_version', '3')`
  );
  await db.execute(
    `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('last_d365_sync', '')`
  );
  await db.execute(
    `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('last_training_sync', '')`
  );
}

async function runMigrations(db: Database, currentVersion: number): Promise<void> {
  if (currentVersion < 2) {
    await db.execute(`ALTER TABLE customers ADD COLUMN reseller_id TEXT`);
  }

  if (currentVersion < 3) {
    // Safe to re-run: ALTER TABLE ADD COLUMN is a no-op if column already exists in SQLite
    // but we guard with a try-catch for the reseller_id column added in v2
    for (const col of ['bcn TEXT', 'cloud_customer INTEGER', 'language TEXT', 'arr REAL']) {
      try { await db.execute(`ALTER TABLE customers ADD COLUMN ${col}`); } catch { /* column may already exist */ }
    }

    // Backfill from mock data if applicable
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
      const { mockCustomers } = await import('@/lib/mock/customers');
      for (const c of mockCustomers) {
        await db.execute(
          `UPDATE customers SET reseller_id = $1, bcn = $2, cloud_customer = $3, language = $4, arr = $5 WHERE id = $6`,
          [c.resellerId, c.bcn, c.cloudCustomer ? 1 : 0, c.language, c.arr, c.id]
        );
      }
    }

    await db.execute(
      `UPDATE app_settings SET value = '3', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }
}

async function seedIfNeeded(db: Database): Promise<void> {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'true') return;

  const existing = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM customers`
  );
  if (existing[0]?.count > 0) return;

  const { seedMockData } = await import('@/lib/db/seed');
  await seedMockData(db);
}
