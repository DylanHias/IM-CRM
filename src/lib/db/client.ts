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
      await dbInstance.execute('PRAGMA busy_timeout=5000');
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
      health_score    INTEGER,
      synced_at       TEXT NOT NULL,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      reseller_id     TEXT,
      bcn             TEXT,
      cloud_customer  INTEGER,
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
      cloud_contact INTEGER,
      is_primary    INTEGER NOT NULL DEFAULT 0,
      sync_status   TEXT NOT NULL DEFAULT 'pending',
      remote_id     TEXT,
      source        TEXT DEFAULT 'local',
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
      activity_status TEXT NOT NULL DEFAULT 'open',
      direction       TEXT,
      created_by_id   TEXT NOT NULL,
      created_by_name TEXT NOT NULL,
      sync_status     TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN ('pending','synced','error')),
      remote_id       TEXT,
      source          TEXT DEFAULT 'local',
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_activities_customer ON activities(customer_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_activities_occurred ON activities(occurred_at DESC)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_activities_sync ON activities(sync_status)`);

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
      source          TEXT DEFAULT 'local',
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_followups_customer ON follow_ups(customer_id)`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_followups_due ON follow_ups(due_date)`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_records (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_type      TEXT NOT NULL CHECK(sync_type IN ('d365','push_activities','push_followups')),
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
      sell_type                TEXT NOT NULL DEFAULT 'New',
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
      title TEXT,
      last_active_at TEXT,
      profile_photo TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

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

  await db.execute(`
    CREATE TABLE IF NOT EXISTS pending_deletes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('phonecall','appointment','annotation','task','opportunity','contact')),
      remote_id  TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS customer_favorites (
      customer_id TEXT PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS saved_queries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      sql        TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

// Idempotent column backfill — runs every startup after ensureTablesExist.
// Ensures every column ever added by a migration exists, regardless of whether
// the DB came from a fresh install or an upgrade. Add an entry here whenever
// a migration adds a new column so fresh installs can never silently miss it.
async function ensureAllColumns(db: Database): Promise<void> {
  const cols: [string, string, string][] = [
    ['customers',  'reseller_id',     'TEXT'],
    ['customers',  'bcn',             'TEXT'],
    ['customers',  'cloud_customer',  'INTEGER'],
    ['customers',  'arr',             'REAL'],
    ['customers',  'health_score',    'INTEGER'],
    ['contacts',   'contact_type',    'TEXT'],
    ['contacts',   'cloud_contact',   'INTEGER'],
    ['contacts',   'sync_status',     "TEXT NOT NULL DEFAULT 'synced'"],
    ['contacts',   'remote_id',       'TEXT'],
    ['contacts',   'source',          "TEXT DEFAULT 'd365'"],
    ['contacts',   'is_primary',      'INTEGER NOT NULL DEFAULT 0'],
    ['activities', 'start_time',      'TEXT'],
    ['activities', 'source',          "TEXT DEFAULT 'local'"],
    ['activities', 'activity_status', "TEXT NOT NULL DEFAULT 'open'"],
    ['activities', 'direction',       'TEXT'],
    ['follow_ups', 'source',          "TEXT DEFAULT 'local'"],
    ['users',      'title',           'TEXT'],
    ['users',      'profile_photo',   'TEXT'],
  ];
  for (const [table, col, def] of cols) {
    try { await db.execute(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`); } catch { /* column already exists */ }
  }
}

async function runSchema(db: Database): Promise<void> {
  // Always ensure all tables exist first — guards against partial init or corruption
  await ensureTablesExist(db);
  // Always backfill any columns that may be missing (handles fresh install / migration drift)
  await ensureAllColumns(db);

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
    `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('schema_version', '26')`
  );
  await db.execute(
    `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('last_d365_sync', '')`
  );
}

async function runMigrations(db: Database, currentVersion: number): Promise<void> {
  if (currentVersion < 2) {
    await db.execute(`ALTER TABLE customers ADD COLUMN reseller_id TEXT`);
  }

  if (currentVersion < 3) {
    // Safe to re-run: ALTER TABLE ADD COLUMN is a no-op if column already exists in SQLite
    // but we guard with a try-catch for the reseller_id column added in v2
    for (const col of ['bcn TEXT', 'cloud_customer INTEGER', 'arr REAL']) {
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

  if (currentVersion < 9) {
    // Fix: ensure hardcoded admin emails always have role='admin' in the DB
    await db.execute(
      `UPDATE users SET role = 'admin', updated_at = datetime('now') WHERE LOWER(email) = 'dylan.hias@ingrammicro.com' AND role != 'admin'`
    );
    await db.execute(
      `UPDATE app_settings SET value = '9', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 10) {
    // Add source column to activities and follow_ups for D365 pull sync
    try { await db.execute(`ALTER TABLE activities ADD COLUMN source TEXT DEFAULT 'local'`); } catch (err) {
      // Expected if column already exists (duplicate column name)
      if (!(err instanceof Error && err.message.includes('duplicate column'))) {
        console.error('[db] Failed to add source column to activities:', err);
      }
    }
    try { await db.execute(`ALTER TABLE follow_ups ADD COLUMN source TEXT DEFAULT 'local'`); } catch (err) {
      // Expected if column already exists (duplicate column name)
      if (!(err instanceof Error && err.message.includes('duplicate column'))) {
        console.error('[db] Failed to add source column to follow_ups:', err);
      }
    }
    await db.execute(
      `UPDATE app_settings SET value = '10', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 11) {
    // Retry adding source columns — migration v10 silently swallowed failures
    try { await db.execute(`ALTER TABLE activities ADD COLUMN source TEXT DEFAULT 'local'`); } catch {
      // Column already exists — expected on fresh installs or successful v10 migration
    }
    try { await db.execute(`ALTER TABLE follow_ups ADD COLUMN source TEXT DEFAULT 'local'`); } catch {
      // Column already exists — expected on fresh installs or successful v10 migration
    }
    await db.execute(
      `UPDATE app_settings SET value = '11', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 12) {
    try { await db.execute(`ALTER TABLE users ADD COLUMN title TEXT`); } catch {
      // Column already exists — expected on fresh installs
    }
    await db.execute(
      `UPDATE app_settings SET value = '12', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 13) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS customer_favorites (
        customer_id TEXT PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await db.execute(
      `UPDATE app_settings SET value = '13', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 14) {
    try { await db.execute(`ALTER TABLE activities ADD COLUMN activity_status TEXT NOT NULL DEFAULT 'open'`); } catch {
      // Column already exists
    }
    await db.execute(
      `UPDATE app_settings SET value = '14', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 15) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS saved_queries (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        sql        TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    await db.execute(
      `UPDATE app_settings SET value = '15', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 16) {
    try { await db.execute(`ALTER TABLE activities ADD COLUMN direction TEXT`); } catch {
      // Column already exists
    }
    await db.execute(
      `UPDATE app_settings SET value = '16', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 17) {
    try { await db.execute(`ALTER TABLE contacts ADD COLUMN cloud_contact INTEGER`); } catch { /* column may already exist */ }
    await db.execute(
      `UPDATE app_settings SET value = '17', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 18) {
    try { await db.execute(`ALTER TABLE users ADD COLUMN profile_photo TEXT`); } catch { /* column may already exist */ }
    await db.execute(
      `UPDATE app_settings SET value = '18', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 19) {
    // Drop sell_type CHECK constraint on opportunities — D365 returns values beyond 'New'/'Install'
    // SQLite requires table rebuild to drop a CHECK constraint
    await db.execute(`
      CREATE TABLE IF NOT EXISTS opportunities_new (
        id                       TEXT PRIMARY KEY,
        customer_id              TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        contact_id               TEXT REFERENCES contacts(id) ON DELETE SET NULL,
        status                   TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Won','Lost')),
        subject                  TEXT NOT NULL,
        bcn                      TEXT,
        multi_vendor_opportunity  INTEGER NOT NULL DEFAULT 0 CHECK(multi_vendor_opportunity IN (0,1)),
        sell_type                TEXT NOT NULL DEFAULT 'New',
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
    await db.execute(`INSERT INTO opportunities_new SELECT * FROM opportunities`);
    await db.execute(`DROP TABLE opportunities`);
    await db.execute(`ALTER TABLE opportunities_new RENAME TO opportunities`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_opportunities_customer ON opportunities(customer_id)`);
    await db.execute(`CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status)`);
    await db.execute(
      `UPDATE app_settings SET value = '19', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 20) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS pending_deletes_new (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL CHECK(entity_type IN ('phonecall','appointment','annotation','task','opportunity')),
        remote_id  TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
    await db.execute(`INSERT INTO pending_deletes_new SELECT * FROM pending_deletes`);
    await db.execute(`DROP TABLE pending_deletes`);
    await db.execute(`ALTER TABLE pending_deletes_new RENAME TO pending_deletes`);
    await db.execute(
      `UPDATE app_settings SET value = '20', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 21) {
    // Add sync tracking columns to contacts
    try { await db.execute(`ALTER TABLE contacts ADD COLUMN sync_status TEXT NOT NULL DEFAULT 'synced'`); } catch { /* already exists */ }
    try { await db.execute(`ALTER TABLE contacts ADD COLUMN remote_id TEXT`); } catch { /* already exists */ }
    try { await db.execute(`ALTER TABLE contacts ADD COLUMN source TEXT DEFAULT 'd365'`); } catch { /* already exists */ }
    // Backfill remote_id for existing D365-pulled contacts (their id IS the D365 contactid)
    await db.execute(`UPDATE contacts SET remote_id = id WHERE remote_id IS NULL`);
    // Recreate pending_deletes to allow 'contact' entity type
    await db.execute(`
      CREATE TABLE IF NOT EXISTS pending_deletes_v21 (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        remote_id   TEXT NOT NULL,
        created_at  TEXT DEFAULT (datetime('now'))
      )
    `);
    await db.execute(`INSERT INTO pending_deletes_v21 SELECT * FROM pending_deletes`);
    await db.execute(`DROP TABLE pending_deletes`);
    await db.execute(`ALTER TABLE pending_deletes_v21 RENAME TO pending_deletes`);
    await db.execute(
      `UPDATE app_settings SET value = '21', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 22) {
    try { await db.execute(`ALTER TABLE contacts ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0`); } catch { /* already exists */ }
    await db.execute(
      `UPDATE app_settings SET value = '22', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 23) {
    // direction was added in v16 migration but DBs already at v16+ missed it — ensure column exists
    try { await db.execute(`ALTER TABLE activities ADD COLUMN direction TEXT`); } catch { /* already exists */ }
    await db.execute(
      `UPDATE app_settings SET value = '23', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 24) {
    try { await db.execute(`ALTER TABLE customers ADD COLUMN health_score INTEGER`); } catch { /* already exists */ }
    await db.execute(
      `UPDATE app_settings SET value = '24', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 25) {
    // D365 returns GUIDs uppercase in OData-EntityId headers (after POST) but lowercase
    // in GET responses. That case mismatch caused user-created records to be re-inserted
    // as duplicates on the next full sync. Normalize to lowercase + dedupe + prevent recurrence.
    for (const table of ['activities', 'follow_ups', 'opportunities']) {
      await db.execute(`UPDATE ${table} SET remote_id = lower(remote_id) WHERE remote_id IS NOT NULL AND remote_id != lower(remote_id)`);
      await db.execute(`
        DELETE FROM ${table}
        WHERE remote_id IS NOT NULL
          AND rowid NOT IN (SELECT MIN(rowid) FROM ${table} WHERE remote_id IS NOT NULL GROUP BY remote_id)
      `);
      await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_${table}_remote_unique ON ${table}(remote_id) WHERE remote_id IS NOT NULL`);
    }
    await db.execute(
      `UPDATE app_settings SET value = '25', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }

  if (currentVersion < 26) {
    await db.execute(`DROP INDEX IF EXISTS idx_invoices_reseller`);
    await db.execute(`DROP INDEX IF EXISTS idx_invoice_lines_invoice`);
    await db.execute(`DROP TABLE IF EXISTS invoice_lines`);
    await db.execute(`DROP TABLE IF EXISTS invoices`);
    await db.execute(
      `UPDATE app_settings SET value = '26', updated_at = datetime('now') WHERE key = 'schema_version'`
    );
  }
}

