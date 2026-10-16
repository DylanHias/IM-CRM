import { DatabaseSync } from 'node:sqlite';

// Real in-memory SQLite (built into Node) so report queries are tested on numbers, not SQL text.
// Use: vi.mock('@/lib/db/client', async () => ({ getDb: (await import('./sqliteFixture')).fixtureGetDb }))
// then call resetFixture() in beforeEach and the seed helpers below.

let db: DatabaseSync;

export function resetFixture(): void {
  db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, owner_id TEXT, address_country TEXT, segment TEXT, industry TEXT);
    CREATE TABLE customer_revenue (id INTEGER PRIMARY KEY AUTOINCREMENT, bcn TEXT NOT NULL, customer_id TEXT, arr_lc REAL);
    CREATE TABLE arr_movement (
      bcn TEXT NOT NULL, month TEXT NOT NULL,
      upgrade_lc REAL, downgrade_lc REAL, cancellation_lc REAL, new_sale_lc REAL,
      PRIMARY KEY (bcn, month)
    );
    CREATE TABLE activities (id TEXT PRIMARY KEY, customer_id TEXT NOT NULL, occurred_at TEXT NOT NULL);
    CREATE TABLE opportunities (
      id                       TEXT PRIMARY KEY,
      customer_id              TEXT NOT NULL,
      status                   TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Won','Lost')),
      subject                  TEXT NOT NULL,
      sell_type                TEXT NOT NULL DEFAULT 'New',
      primary_vendor           TEXT,
      stage                    TEXT NOT NULL DEFAULT 'Prospecting',
      probability              INTEGER NOT NULL DEFAULT 5,
      expiration_date          TEXT,
      estimated_revenue        REAL,
      annual_revenue           REAL,
      actual_revenue           REAL,
      close_date               TEXT,
      currency                 TEXT NOT NULL DEFAULT 'EUR',
      created_by_id            TEXT NOT NULL,
      created_by_name          TEXT NOT NULL,
      created_at               TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at               TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export async function fixtureGetDb() {
  return {
    // Positional $N placeholders bind by name in SQLite, so map params to { $1: v1, ... }.
    select: async (sql: string, params: unknown[] = []) => {
      const named = Object.fromEntries(params.map((v, i) => [`$${i + 1}`, v]));
      return db.prepare(sql).all(named);
    },
    execute: async () => undefined,
  };
}

export function addCustomer(
  id: string,
  owner: string | null,
  country: string | null,
  extra: { segment?: string | null; industry?: string | null } = {},
): void {
  db.prepare('INSERT INTO customers (id, name, owner_id, address_country, segment, industry) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, `Customer ${id}`, owner, country, extra.segment ?? null, extra.industry ?? null);
}

export function addRevenue(bcn: string, customerId: string | null, arrLc: number): void {
  db.prepare('INSERT INTO customer_revenue (bcn, customer_id, arr_lc) VALUES (?, ?, ?)').run(bcn, customerId, arrLc);
}

export interface MovementSeed {
  newSale?: number;
  upgrade?: number;
  downgrade?: number;
  cancellation?: number;
}

export function addMovement(bcn: string, month: string, m: MovementSeed): void {
  db.prepare('INSERT INTO arr_movement (bcn, month, new_sale_lc, upgrade_lc, downgrade_lc, cancellation_lc) VALUES (?, ?, ?, ?, ?, ?)')
    .run(bcn, month, m.newSale ?? 0, m.upgrade ?? 0, m.downgrade ?? 0, m.cancellation ?? 0);
}

export interface OpportunitySeed {
  customerId?: string;
  owner?: string;
  status?: 'Open' | 'Won' | 'Lost';
  stage?: string;
  probability?: number;
  vendor?: string | null;
  sellType?: string;
  annual?: number | null;
  estimated?: number | null;
  actual?: number | null;
  currency?: string;
  expiration?: string | null;
  closeDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

let seq = 0;

export function addOpportunity(o: OpportunitySeed = {}): string {
  const id = `opp${++seq}`;
  db.prepare(
    `INSERT INTO opportunities (id, customer_id, status, subject, sell_type, primary_vendor, stage, probability,
       expiration_date, estimated_revenue, annual_revenue, actual_revenue, close_date, currency,
       created_by_id, created_by_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id, o.customerId ?? 'a', o.status ?? 'Open', `Deal ${id}`, o.sellType ?? 'New', o.vendor ?? null,
    o.stage ?? 'Prospecting', o.probability ?? 50, o.expiration ?? null, o.estimated ?? null, o.annual ?? null,
    o.actual ?? null, o.closeDate ?? null, o.currency ?? 'EUR', o.owner ?? 'u1', 'Owner',
    o.createdAt ?? '2026-01-01 00:00:00', o.updatedAt ?? '2026-01-01 00:00:00',
  );
  return id;
}

export function addActivity(customerId: string, occurredAt: string): void {
  db.prepare('INSERT INTO activities (id, customer_id, occurred_at) VALUES (?, ?, ?)').run(`act${++seq}`, customerId, occurredAt);
}
