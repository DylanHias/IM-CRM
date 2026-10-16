// SQL fragments shared by every report and by Home, so one account reads the same everywhere.

/** Summed Power BI ARR per customer (several reseller rows each), with end-customer count and latest month. A customer absent here is unmatched, not zero. */
export const ARR_BY_CUSTOMER = `(SELECT customer_id, SUM(arr_lc) AS arr, SUM(active_end_customers) AS active_end_customers, MAX(as_of_month) AS as_of_month FROM customer_revenue WHERE customer_id IS NOT NULL GROUP BY customer_id)`;

/**
 * Last contact per customer: latest activity of any owner, clipped to now so a scheduled meeting does not count.
 * customers.last_activity_at is deliberately never read: it only ever rises and moves on contact edits.
 * Alias this `lc`; customers without a row were never contacted.
 */
export const lastContactSql = (nowParam: string) =>
  `(SELECT customer_id, MAX(occurred_at) AS last_at FROM activities WHERE julianday(occurred_at) <= julianday(${nowParam}) GROUP BY customer_id)`;

/** Whole days since last contact (truncated), so every tab buckets the same account the same way. Needs the `lc` alias. */
export const daysSinceSql = (nowParam: string) => `CAST(julianday(${nowParam}) - julianday(lc.last_at) AS INTEGER)`;

/** Positional params with a fresh slot per bind: a placeholder is never reused, so position always equals meaning. */
export function paramBinder(initial: unknown[]) {
  const params = [...initial];
  return {
    params,
    bind: (value: unknown) => {
      params.push(value);
      return `$${params.length}`;
    },
  };
}
