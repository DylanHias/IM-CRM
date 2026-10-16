import { format, subMonths } from 'date-fns';
import { getDb } from '@/lib/db/client';
import { monthKeys, type ReportPeriod } from '@/lib/reports/period';
import { accountScopeSql, activityScopeSql, dealScopeSql, type ReportScope } from '@/lib/reports/scope';
import { paramBinder } from '@/lib/reports/sql';
import type { ActivityVolume } from '@/types/reports';

const KEY = 'yyyy-MM';

/** The month keys of the window of equal length immediately before `months` (non-empty). */
function previousKeys(months: string[]): { first: string; last: string } {
  const [y, m] = months[0].split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  return { first: format(subMonths(start, months.length), KEY), last: format(subMonths(start, 1), KEY) };
}

export async function queryActivityVolume(s: ReportScope, p: ReportPeriod): Promise<ActivityVolume> {
  const months = monthKeys(p);
  if (months.length === 0) return { total: 0, previous: 0, byMonth: [] };
  const prev = previousKeys(months);
  const scope = activityScopeSql(s, 0);
  const { params, bind } = paramBinder(scope.params);
  try {
    const db = await getDb();
    const rows = await db.select<{ month: string; type: string; count: number }[]>(
      `SELECT strftime('%Y-%m', a.occurred_at) AS month, a.type AS type, COUNT(*) AS count
       FROM activities a
       WHERE ${scope.sql}
         AND strftime('%Y-%m', a.occurred_at) >= ${bind(prev.first)}
         AND strftime('%Y-%m', a.occurred_at) <= ${bind(months[months.length - 1])}
       GROUP BY month, type
       ORDER BY month, type`,
      params,
    );
    const inPeriod = rows.filter((r) => r.month >= months[0]);
    return {
      total: inPeriod.reduce((t, r) => t + r.count, 0),
      previous: rows.filter((r) => r.month < months[0]).reduce((t, r) => t + r.count, 0),
      byMonth: inPeriod,
    };
  } catch (err) {
    console.error('[activity] queryActivityVolume failed:', err);
    throw err;
  }
}

/** Touched = any activity on the account in the period, whoever logged it; owned = active accounts in scope. */
export async function queryAccountsTouched(s: ReportScope, p: ReportPeriod): Promise<{ touched: number; owned: number }> {
  const months = monthKeys(p);
  if (months.length === 0) return { touched: 0, owned: 0 };
  const scope = accountScopeSql(s, 0);
  const { params, bind } = paramBinder(scope.params);
  try {
    const db = await getDb();
    const [r] = await db.select<{ touched: number; owned: number }[]>(
      `SELECT COUNT(*) AS owned,
              COUNT(CASE WHEN EXISTS (
                SELECT 1 FROM activities a
                WHERE a.customer_id = c.id
                  AND strftime('%Y-%m', a.occurred_at) >= ${bind(months[0])}
                  AND strftime('%Y-%m', a.occurred_at) <= ${bind(months[months.length - 1])}
              ) THEN 1 END) AS touched
       FROM customers c
       WHERE ${scope.sql}`,
      params,
    );
    return { touched: r?.touched ?? 0, owned: r?.owned ?? 0 };
  } catch (err) {
    console.error('[activity] queryAccountsTouched failed:', err);
    throw err;
  }
}

/** Completed = completed_at in the period. Total = follow-ups due or completed in it, so one created but not yet due is never counted against the user. */
export async function queryFollowUpCompletion(s: ReportScope, p: ReportPeriod): Promise<{ completed: number; total: number }> {
  const months = monthKeys(p);
  if (months.length === 0) return { completed: 0, total: 0 };
  const scope = activityScopeSql(s, 0, 'f');
  const { params, bind } = paramBinder(scope.params);
  try {
    const db = await getDb();
    const inRange = (col: string) =>
      `(strftime('%Y-%m', ${col}) >= ${bind(months[0])} AND strftime('%Y-%m', ${col}) <= ${bind(months[months.length - 1])})`;
    const [r] = await db.select<{ completed: number; total: number }[]>(
      `SELECT COUNT(CASE WHEN f.completed = 1 AND ${inRange('f.completed_at')} THEN 1 END) AS completed,
              COUNT(CASE WHEN (f.completed = 1 AND ${inRange('f.completed_at')}) OR ${inRange('f.due_date')} THEN 1 END) AS total
       FROM follow_ups f
       WHERE ${scope.sql}`,
      params,
    );
    return { completed: r?.completed ?? 0, total: r?.total ?? 0 };
  } catch (err) {
    console.error('[followup] queryFollowUpCompletion failed:', err);
    throw err;
  }
}

/** Activities logged in the period per deal won in it; null when nothing was won. */
export async function queryActivitiesPerWonDeal(s: ReportScope, p: ReportPeriod): Promise<number | null> {
  const months = monthKeys(p);
  if (months.length === 0) return null;
  const actScope = activityScopeSql(s, 0);
  const { params, bind } = paramBinder(actScope.params);
  try {
    const db = await getDb();
    const aFrom = bind(months[0]);
    const aTo = bind(months[months.length - 1]);
    const dealScope = dealScopeSql(s, params.length);
    params.push(...dealScope.params);
    const [r] = await db.select<{ activities: number; won: number }[]>(
      `SELECT (SELECT COUNT(*) FROM activities a
                WHERE ${actScope.sql}
                  AND strftime('%Y-%m', a.occurred_at) >= ${aFrom} AND strftime('%Y-%m', a.occurred_at) <= ${aTo}) AS activities,
              (SELECT COUNT(*) FROM opportunities o
                WHERE o.status = 'Won' AND ${dealScope.sql}
                  AND strftime('%Y-%m', o.close_date) >= ${bind(months[0])} AND strftime('%Y-%m', o.close_date) <= ${bind(months[months.length - 1])}) AS won`,
      params,
    );
    return r && r.won > 0 ? r.activities / r.won : null;
  } catch (err) {
    console.error('[data] queryActivitiesPerWonDeal failed:', err);
    throw err;
  }
}
