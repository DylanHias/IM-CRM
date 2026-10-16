import { getDb } from '@/lib/db/client';
import { monthKeys, type ReportPeriod } from '@/lib/reports/period';
import { accountScopeSql, type ReportScope } from '@/lib/reports/scope';
import type { ArrMover, ArrMovement, ArrToday } from '@/types/reports';

// One customer per BCN: customer_revenue holds several rows per BCN, and joining them
// directly would multiply every movement figure.
const BCN_CUSTOMER = `(SELECT bcn, MIN(customer_id) AS customer_id FROM customer_revenue WHERE customer_id IS NOT NULL GROUP BY bcn)`;

const MOVEMENT_SUMS = `
  COALESCE(SUM(m.new_sale_lc), 0) AS new_sale,
  COALESCE(SUM(m.upgrade_lc), 0) AS upgrade,
  COALESCE(SUM(m.downgrade_lc), 0) AS downgrade,
  COALESCE(SUM(m.cancellation_lc), 0) AS cancellation`;

interface MovementRow {
  new_sale: number;
  upgrade: number;
  downgrade: number;
  cancellation: number;
}

function toMovement(r: MovementRow): ArrMovement {
  return {
    newSale: r.new_sale,
    upgrade: r.upgrade,
    downgrade: r.downgrade,
    cancellation: r.cancellation,
    net: r.new_sale + r.upgrade - r.downgrade - r.cancellation,
  };
}

const EMPTY_MOVEMENT: ArrMovement = { newSale: 0, upgrade: 0, downgrade: 0, cancellation: 0, net: 0 };

function movementFrom(s: ReportScope, p: ReportPeriod) {
  const scope = accountScopeSql(s, 0);
  const months = monthKeys(p);
  const n = scope.params.length;
  return {
    params: [...scope.params, months[0], months[months.length - 1]],
    from: `FROM arr_movement m
      JOIN ${BCN_CUSTOMER} map ON map.bcn = m.bcn
      JOIN customers c ON c.id = map.customer_id
      WHERE ${scope.sql} AND m.month >= $${n + 1} AND m.month <= $${n + 2}`,
  };
}

export async function queryArrToday(s: ReportScope): Promise<ArrToday> {
  const scope = accountScopeSql(s, 0);
  try {
    const db = await getDb();
    const rows = await db.select<{ total: number; matched: number; accounts: number }[]>(
      `SELECT COALESCE(SUM(r.arr), 0) AS total, COUNT(r.customer_id) AS matched, COUNT(*) AS accounts
       FROM customers c
       LEFT JOIN (
         SELECT customer_id, SUM(arr_lc) AS arr FROM customer_revenue
         WHERE customer_id IS NOT NULL GROUP BY customer_id
       ) r ON r.customer_id = c.id
       WHERE ${scope.sql}`,
      scope.params,
    );
    const row = rows[0];
    if (!row) return { total: 0, matched: 0, unmatched: 0 };
    return { total: row.total, matched: row.matched, unmatched: row.accounts - row.matched };
  } catch (err) {
    console.error('[data] queryArrToday failed:', err);
    throw err;
  }
}

export async function queryArrMovement(s: ReportScope, p: ReportPeriod): Promise<ArrMovement> {
  const { from, params } = movementFrom(s, p);
  try {
    const db = await getDb();
    const rows = await db.select<MovementRow[]>(`SELECT ${MOVEMENT_SUMS} ${from}`, params);
    return rows[0] ? toMovement(rows[0]) : EMPTY_MOVEMENT;
  } catch (err) {
    console.error('[data] queryArrMovement failed:', err);
    throw err;
  }
}

/** Customers with the largest absolute net movement in the period. */
export async function queryArrMovers(s: ReportScope, p: ReportPeriod, limit: number): Promise<ArrMover[]> {
  const { from, params } = movementFrom(s, p);
  try {
    const db = await getDb();
    const rows = await db.select<(MovementRow & { customer_id: string; name: string })[]>(
      `SELECT c.id AS customer_id, c.name, ${MOVEMENT_SUMS}
       ${from}
       GROUP BY c.id, c.name
       ORDER BY ABS(SUM(COALESCE(m.new_sale_lc, 0) + COALESCE(m.upgrade_lc, 0)
                      - COALESCE(m.downgrade_lc, 0) - COALESCE(m.cancellation_lc, 0))) DESC
       LIMIT $${params.length + 1}`,
      [...params, limit],
    );
    return rows.map((r) => ({ customerId: r.customer_id, name: r.name, ...toMovement(r) }));
  } catch (err) {
    console.error('[data] queryArrMovers failed:', err);
    throw err;
  }
}
