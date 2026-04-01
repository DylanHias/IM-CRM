import type Database from '@tauri-apps/plugin-sql';
import { isTauriApp } from '@/lib/utils/offlineUtils';

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
      await dbInstance.execute('PRAGMA synchronous=NORMAL');
      await dbInstance.execute('PRAGMA cache_size=-64000');
      await dbInstance.execute('PRAGMA temp_store=MEMORY');
      return dbInstance;
    } catch (err) {
      initPromise = null; // reset so next call can retry
      throw err;
    }
  })();

  return initPromise;
}

let txActive = false;

export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  // Skip nesting — if a transaction is already active, just run the function
  if (txActive) return fn();

  const db = await getDb();
  txActive = true;
  await db.execute('BEGIN');
  try {
    const result = await fn();
    await db.execute('COMMIT');
    return result;
  } catch (err) {
    try { await db.execute('ROLLBACK'); } catch { /* may already be rolled back */ }
    throw err;
  } finally {
    txActive = false;
  }
}

const BATCH_SIZE = 500;

export async function withBatchedTransactions<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    await withTransaction(async () => {
      for (const item of chunk) {
        await fn(item);
      }
    });
  }
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

async function ensureTablesExist(db: Database): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

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
      contact_type  TEXT,
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
      start_time      TEXT,
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
      invoice_status          TEXT NOT NULL,
      invoice_date            TEXT NOT NULL,
      invoice_due_date        TEXT NOT NULL,
      invoiced_amount_due     REAL NOT NULL,
      invoice_amount_incl_tax REAL NOT NULL,
      customer_order_number   TEXT,
      end_customer_order_number TEXT,
      order_create_date       TEXT,
      erp_order_number        TEXT,
      payment_terms_due_date  TEXT,
      PRIMARY KEY (invoice_number, reseller_id)
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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS option_sets (
      entity_name    TEXT NOT NULL,
      attribute_name TEXT NOT NULL,
      option_value   INTEGER NOT NULL,
      option_label   TEXT NOT NULL,
      display_order  INTEGER DEFAULT 0,
      synced_at      TEXT NOT NULL,
      PRIMARY KEY (entity_name, attribute_name, option_value)
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_option_sets_lookup ON option_sets(entity_name, attribute_name)`);
}

async function runSchema(db: Database): Promise<void> {
  // Always ensure all tables exist first — guards against partial init or corruption
  await ensureTablesExist(db);

  const rows = await db.select<{ value: string }[]>(
    `SELECT value FROM app_settings WHERE key = 'schema_version'`
  );

  if (rows.length > 0) {
    const version = parseInt(rows[0].value, 10);
    await runMigrations(db, version);
    return;
  }

  // Fresh install — set initial metadata
  await db.execute(
    `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('schema_version', '8')`
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
    await db.execute(
      `UPDATE app_settings SET value = '6', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 7) {
    try { await db.execute(`ALTER TABLE contacts ADD COLUMN contact_type TEXT`); } catch { /* column may already exist */ }
    await db.execute(
      `UPDATE app_settings SET value = '7', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 8) {
    try { await db.execute(`ALTER TABLE activities ADD COLUMN start_time TEXT`); } catch { /* column may already exist */ }

    await db.execute(`
      CREATE TABLE IF NOT EXISTS option_sets (
        entity_name    TEXT NOT NULL,
        attribute_name TEXT NOT NULL,
        option_value   INTEGER NOT NULL,
        option_label   TEXT NOT NULL,
        display_order  INTEGER DEFAULT 0,
        synced_at      TEXT NOT NULL,
        PRIMARY KEY (entity_name, attribute_name, option_value)
      )
    `);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_option_sets_lookup ON option_sets(entity_name, attribute_name)`);

    await db.execute(
      `UPDATE app_settings SET value = '8', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }
}

async function seedIfNeeded(_db: Database): Promise<void> {
  // No-op: database starts empty and is populated via D365 sync
}
