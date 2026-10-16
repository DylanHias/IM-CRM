import { DatabaseSync } from 'node:sqlite';

// Real in-memory SQLite (built into Node) so report queries are tested on numbers, not SQL text.
// Use: vi.mock('@/lib/db/client', async () => ({ getDb: (await import('./sqliteFixture')).fixtureGetDb }))
// then call resetFixture() in beforeEach and the seed helpers below.

let db: DatabaseSync;

export function resetFixture(): void {
  db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, owner_id TEXT, address_country TEXT);
    CREATE TABLE customer_revenue (id INTEGER PRIMARY KEY AUTOINCREMENT, bcn TEXT NOT NULL, customer_id TEXT, arr_lc REAL);
    CREATE TABLE arr_movement (
      bcn TEXT NOT NULL, month TEXT NOT NULL,
      upgrade_lc REAL, downgrade_lc REAL, cancellation_lc REAL, new_sale_lc REAL,
      PRIMARY KEY (bcn, month)
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

export function addCustomer(id: string, owner: string | null, country: string | null): void {
  db.prepare('INSERT INTO customers (id, name, owner_id, address_country) VALUES (?, ?, ?, ?)').run(id, `Customer ${id}`, owner, country);
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
