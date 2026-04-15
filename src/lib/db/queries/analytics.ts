import { getDb } from '@/lib/db/client';
import type {
  DateRange,
  PersonalStats,
  ForecastPoint,
  ExpiringOpportunity,
  DealBySellType,
  DealByVendor,
  StageFunnelPoint,
  PipelineData,
  ArrByDimensionPoint,
  TopCustomer,
  CustomerHealthData,
  ActivityTypeRow,
  ActivityPatternsData,
} from '@/types/analytics';

// ── Helpers ───────────────────────────────────────────────────────────────────

function rangeParams(range: DateRange): [string, string] {
  return [range.from, range.to];
}

// Builds a parameterized IN clause: "$1, $2, ..." starting at `offset + 1`
function inClause(count: number, offset = 0): string {
  return Array.from({ length: count }, (_, i) => `$${i + 1 + offset}`).join(', ');
}

// ── Personal ──────────────────────────────────────────────────────────────────

// userIds contains both the D365 system GUID and the Azure AD localAccountId so activities
// stored with either identifier (local creation vs D365-synced) are always matched.

async function queryMyActivityCount(userIds: string[], range: DateRange): Promise<number> {
  const db = await getDb();
  const n = userIds.length;
  const [row] = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM activities
     WHERE created_by_id IN (${inClause(n)}) AND occurred_at >= $${n + 1} AND occurred_at <= $${n + 2}`,
    [...userIds, ...rangeParams(range)],
  );
  return row?.count ?? 0;
}

async function queryMyActivityTimeline(userIds: string[], range: DateRange): Promise<{ date: string; count: number }[]> {
  const db = await getDb();
  const n = userIds.length;
  return db.select<{ date: string; count: number }[]>(
    `SELECT strftime('%Y-%m-%d', occurred_at) as date, COUNT(*) as count
     FROM activities
     WHERE created_by_id IN (${inClause(n)}) AND occurred_at >= $${n + 1} AND occurred_at <= $${n + 2}
     GROUP BY date
     ORDER BY date`,
    [...userIds, ...rangeParams(range)],
  );
}

async function queryMyFollowUpCompletion(userIds: string[], range: DateRange): Promise<{ completed: number; total: number; avgDaysToComplete: number }> {
  const db = await getDb();
  const n = userIds.length;
  const [row] = await db.select<{ total: number; completed: number; avgDays: number | null }[]>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
       AVG(CASE WHEN completed = 1 AND completed_at IS NOT NULL
                THEN julianday(completed_at) - julianday(created_at) ELSE NULL END) as avgDays
     FROM follow_ups
     WHERE created_by_id IN (${inClause(n)}) AND created_at >= $${n + 1} AND created_at <= $${n + 2}`,
    [...userIds, ...rangeParams(range)],
  );
  return {
    total: row?.total ?? 0,
    completed: row?.completed ?? 0,
    avgDaysToComplete: row?.avgDays != null ? Math.round(row.avgDays * 10) / 10 : 0,
  };
}

async function queryMyPipeline(userIds: string[]): Promise<{ openCount: number; openValue: number; weightedForecast: number }> {
  const db = await getDb();
  const [row] = await db.select<{ openCount: number; openValue: number; weightedForecast: number }[]>(
    `SELECT
       COUNT(*) as openCount,
       COALESCE(SUM(estimated_revenue), 0) as openValue,
       COALESCE(SUM(estimated_revenue * probability / 100.0), 0) as weightedForecast
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

async function queryMyWinRate(userIds: string[]): Promise<{ won: number; lost: number }> {
  const db = await getDb();
  const rows = await db.select<{ status: string; count: number }[]>(
    `SELECT status, COUNT(*) as count FROM opportunities
     WHERE created_by_id IN (${inClause(userIds.length)}) AND status IN ('Won', 'Lost')
     GROUP BY status`,
    userIds,
  );
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status] = r.count;
  return { won: map['Won'] ?? 0, lost: map['Lost'] ?? 0 };
}

export async function queryPersonalStats(
  userIds: string[],
  range: DateRange,
  prevRange: DateRange,
): Promise<PersonalStats> {
  const [current, previous, timeline, followUpCompletion, pipeline, winRate] = await Promise.all([
    queryMyActivityCount(userIds, range),
    queryMyActivityCount(userIds, prevRange),
    queryMyActivityTimeline(userIds, range),
    queryMyFollowUpCompletion(userIds, range),
    queryMyPipeline(userIds),
    queryMyWinRate(userIds),
  ]);
  return { activityCount: { current, previous }, activityTimeline: timeline, followUpCompletion, pipeline, winRate };
}

// ── Pipeline ──────────────────────────────────────────────────────────────────

export async function queryPipelineData(): Promise<PipelineData> {
  const db = await getDb();

  const [kpiRow] = await db.select<{ openCount: number; openValue: number; weightedForecast: number; multiCount: number; totalCount: number }[]>(
    `SELECT
       COUNT(*) as openCount,
       COALESCE(SUM(estimated_revenue), 0) as openValue,
       COALESCE(SUM(estimated_revenue * probability / 100.0), 0) as weightedForecast,
       SUM(CASE WHEN multi_vendor_opportunity = 1 THEN 1 ELSE 0 END) as multiCount,
       COUNT(*) as totalCount
     FROM opportunities WHERE status = 'Open'`,
  );

  const multiVendorRate =
    kpiRow && kpiRow.totalCount > 0 ? (kpiRow.multiCount / kpiRow.totalCount) * 100 : 0;

  const [forecast, expiring, bySellType, byVendor, stageFunnel, winRateRows] = await Promise.all([
    db.select<ForecastPoint[]>(
      `SELECT strftime('%Y-%m', expiration_date) as month,
         COALESCE(SUM(estimated_revenue * probability / 100.0), 0) as weighted,
         COALESCE(SUM(estimated_revenue), 0) as total
       FROM opportunities
       WHERE status = 'Open' AND expiration_date IS NOT NULL
       GROUP BY month ORDER BY month`,
    ),

    db.select<{ id: string; subject: string; estimatedRevenue: number | null; expirationDate: string; stage: string; customerName: string }[]>(
      `SELECT o.id, o.subject,
         o.estimated_revenue as estimatedRevenue,
         o.expiration_date as expirationDate,
         o.stage,
         COALESCE(c.name, 'Unknown') as customerName
       FROM opportunities o
       LEFT JOIN customers c ON c.id = o.customer_id
       WHERE o.status = 'Open'
         AND o.expiration_date IS NOT NULL
         AND o.expiration_date BETWEEN date('now') AND date('now', '+30 days')
       ORDER BY o.expiration_date ASC`,
    ),

    db.select<DealBySellType[]>(
      `SELECT
         sell_type as sellType,
         COUNT(*) as count,
         AVG(COALESCE(estimated_revenue, 0)) as avgRevenue,
         SUM(COALESCE(estimated_revenue, 0)) as totalRevenue
       FROM opportunities
       WHERE status = 'Open' AND sell_type IS NOT NULL AND sell_type != ''
       GROUP BY sell_type
       ORDER BY count DESC`,
    ),

    db.select<DealByVendor[]>(
      `SELECT
         primary_vendor as vendor,
         COUNT(*) as count,
         AVG(COALESCE(estimated_revenue, 0)) as avgRevenue
       FROM opportunities
       WHERE status = 'Open' AND primary_vendor IS NOT NULL AND primary_vendor != ''
       GROUP BY primary_vendor
       ORDER BY avgRevenue DESC
       LIMIT 10`,
    ),

    db.select<StageFunnelPoint[]>(
      `SELECT stage, COUNT(*) as count, COALESCE(SUM(estimated_revenue), 0) as totalRevenue
       FROM opportunities
       WHERE status = 'Open'
       GROUP BY stage`,
    ),

    db.select<{ status: string; count: number }[]>(
      `SELECT status, COUNT(*) as count FROM opportunities GROUP BY status`,
    ),
  ]);

  const winRateMap: Record<string, number> = {};
  for (const r of winRateRows) winRateMap[r.status] = r.count;

  return {
    kpis: {
      openCount: kpiRow?.openCount ?? 0,
      openValue: kpiRow?.openValue ?? 0,
      weightedForecast: kpiRow?.weightedForecast ?? 0,
      multiVendorRate,
    },
    forecast,
    expiring,
    bySellType,
    byVendor,
    stageFunnel,
    winRate: { won: winRateMap['Won'] ?? 0, lost: winRateMap['Lost'] ?? 0, open: winRateMap['Open'] ?? 0 },
  };
}

// ── Customers ─────────────────────────────────────────────────────────────────

async function queryArrByColumn(column: string): Promise<ArrByDimensionPoint[]> {
  const db = await getDb();
  // column is always one of: industry, segment, address_country — no user input
  return db.select<ArrByDimensionPoint[]>(
    `SELECT ${column} as label,
       COALESCE(SUM(arr), 0) as totalArr,
       COUNT(*) as customerCount
     FROM customers
     WHERE status = 'active' AND ${column} IS NOT NULL AND ${column} != ''
     GROUP BY ${column}
     ORDER BY totalArr DESC`,
  );
}

export async function queryCustomerHealthData(): Promise<CustomerHealthData> {
  const db = await getDb();

  const [
    staleRow,
    cloudBySegment,
    arrDistribution,
    arrByIndustry,
    arrBySegment,
    arrByCountry,
    topByArr,
    coverageRow,
  ] = await Promise.all([
    db.select<{ count30: number; count60: number; count90: number; total: number; cloudCount: number }[]>(
      `SELECT
         COUNT(CASE WHEN last_activity_at IS NULL OR last_activity_at < datetime('now', '-30 days') THEN 1 END) as count30,
         COUNT(CASE WHEN last_activity_at IS NULL OR last_activity_at < datetime('now', '-60 days') THEN 1 END) as count60,
         COUNT(CASE WHEN last_activity_at IS NULL OR last_activity_at < datetime('now', '-90 days') THEN 1 END) as count90,
         COUNT(*) as total,
         COUNT(CASE WHEN cloud_customer = 1 THEN 1 END) as cloudCount
       FROM customers WHERE status = 'active'`,
    ),

    db.select<{ segment: string; cloud: number; total: number }[]>(
      `SELECT segment,
         SUM(CASE WHEN cloud_customer = 1 THEN 1 ELSE 0 END) as cloud,
         COUNT(*) as total
       FROM customers
       WHERE status = 'active' AND segment IS NOT NULL AND segment != ''
       GROUP BY segment
       ORDER BY total DESC`,
    ),

    db.select<{ bucket: string; count: number }[]>(
      `SELECT
         CASE
           WHEN arr IS NULL OR arr = 0 THEN 'No ARR'
           WHEN arr < 10000 THEN '< €10k'
           WHEN arr < 50000 THEN '€10k–50k'
           WHEN arr < 200000 THEN '€50k–200k'
           ELSE '€200k+'
         END as bucket,
         COUNT(*) as count
       FROM customers WHERE status = 'active'
       GROUP BY bucket`,
    ),

    queryArrByColumn('industry'),
    queryArrByColumn('segment'),
    queryArrByColumn('address_country'),

    db.select<TopCustomer[]>(
      `SELECT id, name, arr, industry, address_country as country
       FROM customers
       WHERE status = 'active' AND arr > 0
       ORDER BY arr DESC
       LIMIT 10`,
    ),

    db.select<{ withContacts: number; withoutContacts: number; avgContactsPerCustomer: number | null }[]>(
      `SELECT
         SUM(CASE WHEN cnt > 0 THEN 1 ELSE 0 END) as withContacts,
         SUM(CASE WHEN cnt = 0 THEN 1 ELSE 0 END) as withoutContacts,
         AVG(CASE WHEN cnt > 0 THEN CAST(cnt AS REAL) ELSE NULL END) as avgContactsPerCustomer
       FROM (
         SELECT c.id, COUNT(co.id) as cnt
         FROM customers c
         LEFT JOIN contacts co ON co.customer_id = c.id
         WHERE c.status = 'active'
         GROUP BY c.id
       )`,
    ),
  ]);

  const cr = coverageRow[0];
  return {
    stale: staleRow[0] ?? { count30: 0, count60: 0, count90: 0, total: 0, cloudCount: 0 },
    cloudBySegment,
    arrDistribution,
    arrByIndustry,
    arrBySegment,
    arrByCountry,
    topByArr,
    contactCoverage: {
      withContacts: cr?.withContacts ?? 0,
      withoutContacts: cr?.withoutContacts ?? 0,
      avgContactsPerCustomer: cr?.avgContactsPerCustomer != null
        ? Math.round(cr.avgContactsPerCustomer * 10) / 10
        : 0,
    },
  };
}

// ── Activity ──────────────────────────────────────────────────────────────────

export async function queryActivityPatternsData(
  userIds: string[],
  range: DateRange,
): Promise<ActivityPatternsData> {
  const db = await getDb();
  const [from, to] = rangeParams(range);
  const n = userIds.length;

  const [callDirection, typeMixRaw, heatmapRaw, mostActiveCustomers] = await Promise.all([
    db.select<{ incoming: number; outgoing: number; unknown: number }[]>(
      `SELECT
         SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as incoming,
         SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as outgoing,
         SUM(CASE WHEN direction IS NULL THEN 1 ELSE 0 END) as unknown
       FROM activities
       WHERE type = 'call' AND occurred_at >= $1 AND occurred_at <= $2`,
      [from, to],
    ),

    db.select<{ type: string; mine: number; team: number }[]>(
      `SELECT type,
         SUM(CASE WHEN created_by_id IN (${inClause(n)}) THEN 1 ELSE 0 END) as mine,
         SUM(CASE WHEN created_by_id NOT IN (${inClause(n)}) THEN 1 ELSE 0 END) as team
       FROM activities
       WHERE occurred_at >= $${n * 2 + 1} AND occurred_at <= $${n * 2 + 2}
       GROUP BY type`,
      [...userIds, ...userIds, from, to],
    ),

    db.select<{ dayOfWeek: number; count: number }[]>(
      `SELECT CAST(strftime('%w', occurred_at) AS INTEGER) as dayOfWeek, COUNT(*) as count
       FROM activities
       WHERE occurred_at >= $1 AND occurred_at <= $2
       GROUP BY dayOfWeek
       ORDER BY dayOfWeek`,
      [from, to],
    ),

    db.select<{ customerId: string; name: string; count: number }[]>(
      `SELECT a.customer_id as customerId, c.name, COUNT(a.id) as count
       FROM activities a
       JOIN customers c ON c.id = a.customer_id
       WHERE a.occurred_at >= $1 AND a.occurred_at <= $2
       GROUP BY a.customer_id, c.name
       ORDER BY count DESC
       LIMIT 10`,
      [from, to],
    ),
  ]);

  // Ensure all 4 activity types are represented
  const typeMix: ActivityTypeRow[] = ['meeting', 'call', 'visit', 'note'].map((t) => {
    const found = typeMixRaw.find((r) => r.type === t);
    return found ?? { type: t, mine: 0, team: 0 };
  });

  // Ensure all 7 days are represented
  const heatmap = Array.from({ length: 7 }, (_, i) => {
    const found = heatmapRaw.find((r) => r.dayOfWeek === i);
    return { dayOfWeek: i, count: found?.count ?? 0 };
  });

  return {
    callDirection: callDirection[0] ?? { incoming: 0, outgoing: 0, unknown: 0 },
    typeMix,
    heatmap,
    mostActiveCustomers,
  };
}
