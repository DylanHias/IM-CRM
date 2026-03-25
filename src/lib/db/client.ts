import type Database from '@tauri-apps/plugin-sql';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { seedMockData } from '@/lib/db/seed';
import { mockCustomers } from '@/lib/mock/customers';
import { mockOpportunities } from '@/lib/mock/opportunities';
import { mockUsers, mockAuditEntries, mockSyncErrors } from '@/lib/mock/admin';

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const { default: SqlDatabase } = await import('@tauri-apps/plugin-sql');
      dbInstance = await SqlDatabase.load('sqlite:crm.db');
      await dbInstance.execute('PRAGMA journal_mode=WAL');
      return dbInstance;
    } catch (err) {
      initPromise = null; // reset so next call can retry
      throw err;
    }
  })();

  return initPromise;
}

export async function initDb(): Promise<void> {
  if (!isTauriApp()) {
    console.warn('[db] Not running in Tauri — SQLite unavailable');
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
      invoice_number     TEXT NOT NULL,
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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id                       TEXT PRIMARY KEY,
      customer_id              TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      contact_id               TEXT REFERENCES contacts(id) ON DELETE SET NULL,
      status                   TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Won','Lost')),
      subject                  TEXT NOT NULL,
      bcn                      TEXT,
      multi_vendor_opportunity  INTEGER NOT NULL DEFAULT 0 CHECK(multi_vendor_opportunity IN (0,1)),
      sell_type                TEXT NOT NULL DEFAULT 'New' CHECK(sell_type IN ('New','Install')),
      primary_vendor           TEXT,
      opportunity_type         TEXT,
      stage                    TEXT NOT NULL DEFAULT 'Prospecting',
      probability              INTEGER NOT NULL DEFAULT 5,
      expiration_date          TEXT,
      estimated_revenue        REAL,
      currency                 TEXT NOT NULL DEFAULT 'EUR',
      country                  TEXT NOT NULL DEFAULT 'Belgium',
      source                   TEXT NOT NULL DEFAULT 'cloud',
      record_type              TEXT NOT NULL DEFAULT 'Sales',
      customer_need            TEXT,
      sync_status              TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending','synced','error')),
      remote_id                TEXT,
      created_by_id            TEXT NOT NULL,
      created_by_name          TEXT NOT NULL,
      created_at               TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at               TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON opportunities(customer_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
      business_unit TEXT,
      last_active_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('create','update','delete')),
      changed_by_id TEXT NOT NULL,
      changed_by_name TEXT NOT NULL,
      old_values TEXT,
      new_values TEXT,
      changed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON audit_log(changed_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_changed_by ON audit_log(changed_by_id)`);

  await db.execute(
    `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('schema_version', '6')`
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

    // Backfill from mock data
    for (const c of mockCustomers) {
      await db.execute(
        `UPDATE customers SET reseller_id = $1, bcn = $2, cloud_customer = $3, language = $4, arr = $5 WHERE id = $6`,
        [c.resellerId, c.bcn, c.cloudCustomer ? 1 : 0, c.language, c.arr, c.id]
      );
    }

    await db.execute(
      `UPDATE app_settings SET value = '3', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 4) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS opportunities (
        id                       TEXT PRIMARY KEY,
        customer_id              TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        contact_id               TEXT REFERENCES contacts(id) ON DELETE SET NULL,
        status                   TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Won','Lost')),
        subject                  TEXT NOT NULL,
        bcn                      TEXT,
        multi_vendor_opportunity  INTEGER NOT NULL DEFAULT 0 CHECK(multi_vendor_opportunity IN (0,1)),
        sell_type                TEXT NOT NULL DEFAULT 'New' CHECK(sell_type IN ('New','Install')),
        primary_vendor           TEXT,
        opportunity_type         TEXT,
        stage                    TEXT NOT NULL DEFAULT 'Prospecting',
        probability              INTEGER NOT NULL DEFAULT 5,
        expiration_date          TEXT,
        estimated_revenue        REAL,
        currency                 TEXT NOT NULL DEFAULT 'EUR',
        country                  TEXT NOT NULL DEFAULT 'Belgium',
        source                   TEXT NOT NULL DEFAULT 'cloud',
        record_type              TEXT NOT NULL DEFAULT 'Sales',
        customer_need            TEXT,
        sync_status              TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending','synced','error')),
        remote_id                TEXT,
        created_by_id            TEXT NOT NULL,
        created_by_name          TEXT NOT NULL,
        created_at               TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at               TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON opportunities(customer_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status)`);

    await db.execute(
      `UPDATE app_settings SET value = '4', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 5) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
        business_unit TEXT,
        last_active_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('create','update','delete')),
        changed_by_id TEXT NOT NULL,
        changed_by_name TEXT NOT NULL,
        old_values TEXT,
        new_values TEXT,
        changed_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON audit_log(changed_at DESC)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_audit_changed_by ON audit_log(changed_by_id)`);

    // Backfill users from existing data — first user becomes admin
    const ownerRows = await db.select<{ id: string; name: string }[]>(`
      SELECT DISTINCT owner_id AS id, owner_name AS name FROM customers WHERE owner_id IS NOT NULL
      UNION
      SELECT DISTINCT created_by_id AS id, created_by_name AS name FROM activities
      UNION
      SELECT DISTINCT created_by_id AS id, created_by_name AS name FROM follow_ups
      UNION
      SELECT DISTINCT created_by_id AS id, created_by_name AS name FROM opportunities
    `);

    let isFirst = true;
    for (const row of ownerRows) {
      if (!row.id) continue;
      await db.execute(
        `INSERT OR IGNORE INTO users (id, email, name, role) VALUES ($1, $2, $3, $4)`,
        [row.id, '', row.name ?? 'Unknown', isFirst ? 'admin' : 'user']
      );
      isFirst = false;
    }

    await db.execute(
      `UPDATE app_settings SET value = '5', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 6) {
    // Backfill opportunities, users, audit log, and sync records that were
    // previously missing from the seed
    for (const o of mockOpportunities) {
      await db.execute(
        `INSERT OR IGNORE INTO opportunities (id,customer_id,contact_id,status,subject,bcn,multi_vendor_opportunity,sell_type,primary_vendor,opportunity_type,stage,probability,expiration_date,estimated_revenue,currency,country,source,record_type,customer_need,sync_status,remote_id,created_by_id,created_by_name,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
        [o.id,o.customerId,o.contactId,o.status,o.subject,o.bcn,o.multiVendorOpportunity?1:0,o.sellType,o.primaryVendor,o.opportunityType,o.stage,o.probability,o.expirationDate,o.estimatedRevenue,o.currency,o.country,o.source,o.recordType,o.customerNeed,o.syncStatus,o.remoteId,o.createdById,o.createdByName,o.createdAt,o.updatedAt]
      );
    }

    for (const u of mockUsers) {
      await db.execute(
        `INSERT OR IGNORE INTO users (id,email,name,role,business_unit,last_active_at,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [u.id,u.email,u.name,u.role,u.businessUnit,u.lastActiveAt,u.createdAt,u.updatedAt]
      );
    }

    for (const a of mockAuditEntries) {
      await db.execute(
        `INSERT OR IGNORE INTO audit_log (id,entity_type,entity_id,action,changed_by_id,changed_by_name,old_values,new_values,changed_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [a.id,a.entityType,a.entityId,a.action,a.changedById,a.changedByName,a.oldValues ? JSON.stringify(a.oldValues) : null,a.newValues ? JSON.stringify(a.newValues) : null,a.changedAt]
      );
    }

    for (const s of mockSyncErrors) {
      await db.execute(
        `INSERT OR IGNORE INTO sync_records (id,sync_type,status,started_at,finished_at,records_pulled,records_pushed,error_message,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [s.id,s.syncType,s.status,s.startedAt,s.finishedAt,s.recordsPulled,s.recordsPushed,s.errorMessage,s.createdAt]
      );
    }

    await db.execute(
      `UPDATE app_settings SET value = '6', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }
}

async function seedIfNeeded(db: Database): Promise<void> {
  const counts = await db.select<{ table_name: string; count: number }[]>(`
    SELECT 'customers' as table_name, COUNT(*) as count FROM customers
    UNION ALL SELECT 'contacts', COUNT(*) FROM contacts
    UNION ALL SELECT 'activities', COUNT(*) FROM activities
    UNION ALL SELECT 'trainings', COUNT(*) FROM trainings
    UNION ALL SELECT 'follow_ups', COUNT(*) FROM follow_ups
    UNION ALL SELECT 'opportunities', COUNT(*) FROM opportunities
    UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
    UNION ALL SELECT 'users', COUNT(*) FROM users
    UNION ALL SELECT 'audit_log', COUNT(*) FROM audit_log
    UNION ALL SELECT 'sync_records', COUNT(*) FROM sync_records
  `);

  const countMap = new Map(counts.map((r) => [r.table_name, r.count]));
  const hasCustomers = (countMap.get('customers') ?? 0) > 0;
  const allPopulated = counts.every((r) => r.count > 0);

  if (allPopulated) return;

  if (!hasCustomers) {
    console.log('[db] Empty database detected — seeding all mock data');
    try {
      await seedMockData(db);
      console.log('[db] Mock data seeded successfully');
    } catch (err) {
      console.error('[db] Seed failed:', err);
    }
    return;
  }

  // Customers exist but some tables are empty — seed only the missing ones
  const emptyTables = counts.filter((r) => r.count === 0).map((r) => r.table_name);
  console.log('[db] Partial data detected — seeding missing tables:', emptyTables.join(', '));
  try {
    const { seedMissingTables } = await import('@/lib/db/seed');
    await seedMissingTables(db, emptyTables);
    console.log('[db] Missing tables seeded successfully');
  } catch (err) {
    console.error('[db] Partial seed failed:', err);
  }
}
