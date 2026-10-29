import { getDb } from '@/lib/db/client';

// Annual revenue is the opportunity's ARR; older rows only carry estimated_revenue.
export const OPP_ARR = 'COALESCE(annual_revenue, estimated_revenue, 0)';
// For columns shown on a row: a deal with no recorded value stays null instead of reading as 0.
export const OPP_ARR_OR_NULL = 'COALESCE(annual_revenue, estimated_revenue)';

// Builds a parameterized IN clause: "$1, $2, ..." starting at `offset + 1`
function inClause(count: number, offset = 0): string {
  return Array.from({ length: count }, (_, i) => `$${i + 1 + offset}`).join(', ');
}

// userIds contains both the D365 system GUID and the Azure AD localAccountId so opportunities
// stored with either identifier (local creation vs D365-synced) are always matched.

export async function queryMyPipeline(userIds: string[]): Promise<{ openCount: number; openValue: number; weightedForecast: number }> {
  const db = await getDb();
  const [row] = await db.select<{ openCount: number; openValue: number; weightedForecast: number }[]>(
    `SELECT
       COUNT(*) as openCount,
       COALESCE(SUM(${OPP_ARR}), 0) as openValue,
       COALESCE(SUM(${OPP_ARR} * probability / 100.0), 0) as weightedForecast
     FROM opportunities
     WHERE created_by_id IN (${inClause(userIds.length)}) AND status = 'Open'`,
    userIds,
  );
  return {
    openCount: row?.openCount ?? 0,
    openValue: row?.openValue ?? 0,
    weightedForecast: row?.weightedForecast ?? 0,
  };
}


export async function queryMyWinRateSince(userIds: string[], sinceIso: string): Promise<{ won: number; lost: number }> {
  const db = await getDb();
  const rows = await db.select<{ status: string; count: number }[]>(
    `SELECT status, COUNT(*) as count FROM opportunities
     WHERE created_by_id IN (${inClause(userIds.length)}) AND status IN ('Won', 'Lost')
       AND close_date >= $${userIds.length + 1}
     GROUP BY status`,
    [...userIds, sinceIso],
  );
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status] = r.count;
  return { won: map['Won'] ?? 0, lost: map['Lost'] ?? 0 };
}

/** Total ARR across every opportunity the user ever owned, whatever its status. */
export async function queryMyLifetimeArr(userIds: string[]): Promise<{ total: number; count: number }> {
  const db = await getDb();
  const [row] = await db.select<{ total: number; count: number }[]>(
    `SELECT COALESCE(SUM(${OPP_ARR}), 0) as total, COUNT(*) as count
     FROM opportunities
     WHERE created_by_id IN (${inClause(userIds.length)})`,
    userIds,
  );
  return { total: row?.total ?? 0, count: row?.count ?? 0 };
}

/** Open pipeline value and deal count per stage for the given users. */
export async function queryMyPipelineByStage(userIds: string[]): Promise<{ stage: string; total: number; count: number }[]> {
  const db = await getDb();
  return db.select<{ stage: string; total: number; count: number }[]>(
    `SELECT stage, COALESCE(SUM(${OPP_ARR}), 0) as total, COUNT(*) as count
     FROM opportunities
     WHERE created_by_id IN (${inClause(userIds.length)}) AND status = 'Open'
     GROUP BY stage`,
    userIds,
  );
}


export async function queryMyPipelineWeeklyDelta(userIds: string[]): Promise<{ currentValue: number; previousValue: number }> {
  const db = await getDb();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const n = userIds.length;
  const [currentRow] = await db.select<{ value: number }[]>(
    `SELECT COALESCE(SUM(${OPP_ARR}), 0) as value FROM opportunities
     WHERE status = 'Open' AND created_by_id IN (${inClause(n)})`,
    userIds,
  );
  const [previousRow] = await db.select<{ value: number }[]>(
    `SELECT COALESCE(SUM(${OPP_ARR}), 0) as value FROM opportunities
     WHERE status = 'Open' AND created_by_id IN (${inClause(n)}) AND created_at < $${n + 1}`,
    [...userIds, sevenDaysAgo],
  );
  return { currentValue: currentRow?.value ?? 0, previousValue: previousRow?.value ?? 0 };
}
