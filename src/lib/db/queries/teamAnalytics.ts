import { getDb } from '@/lib/db/client';
import type {
  AnalyticsRange,
  LeaderboardRow,
  UserDrilldown,
  DrilldownTimelinePoint,
  DrilldownActivity,
  DrilldownOpenOpp,
  DrilldownStaleCustomer,
  DrilldownOverdueFollowup,
  ZeroActivityUser,
  OverdueFollowupSummary,
  AnalyticsRangeKey,
} from '@/types/admin';

// ── Range helpers ───────────────────────────────────────────────────────────

export function buildRange(key: AnalyticsRangeKey, now = new Date()): AnalyticsRange {
  const end = now.toISOString();
  const start = new Date(now);
  switch (key) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case 'qtd': {
      // Quarter-to-date: first day of current calendar quarter
      const month = start.getMonth();
      const quarterStartMonth = Math.floor(month / 3) * 3;
      start.setMonth(quarterStartMonth, 1);
      start.setHours(0, 0, 0, 0);
      break;
    }
  }
  return { start: start.toISOString(), end, key };
}

// ── Leaderboard ─────────────────────────────────────────────────────────────

/**
 * Returns one row per tracked user with all manager-facing stats for the
 * given time range. Activities/follow-ups use occurred_at/created_at;
 * opportunity counts use created_at; opportunity won/lost counts use
 * updated_at (closest proxy for when the status changed locally).
 */
export async function queryTeamLeaderboard(range: AnalyticsRange): Promise<LeaderboardRow[]> {
  const db = await getDb();
  const { start, end } = range;

  const rows = await db.select<{
    userId: string;
    userName: string;
    email: string;
    title: string | null;
    profilePhoto: string | null;
    activityTotal: number;
    meetings: number;
    calls: number;
    visits: number;
    notes: number;
    followupsCreated: number;
    followupsCompleted: number;
    oppsCreated: number;
    oppsCreatedValue: number;
    oppsWon: number;
    oppsWonValue: number;
    oppsLost: number;
    customersTouched: number;
  }[]>(
    `
    SELECT
      u.id          AS userId,
      u.name        AS userName,
      u.email       AS email,
      u.title       AS title,
      u.profile_photo AS profilePhoto,
      COALESCE(a.total, 0)        AS activityTotal,
      COALESCE(a.meetings, 0)     AS meetings,
      COALESCE(a.calls, 0)        AS calls,
      COALESCE(a.visits, 0)       AS visits,
      COALESCE(a.notes, 0)        AS notes,
      COALESCE(f.created, 0)      AS followupsCreated,
      COALESCE(f.completed, 0)    AS followupsCompleted,
      COALESCE(o.created, 0)      AS oppsCreated,
      COALESCE(o.createdValue, 0) AS oppsCreatedValue,
      COALESCE(w.won, 0)          AS oppsWon,
      COALESCE(w.wonValue, 0)     AS oppsWonValue,
      COALESCE(w.lost, 0)         AS oppsLost,
      COALESCE(a.customers, 0)    AS customersTouched
    FROM users u
    LEFT JOIN (
      SELECT created_by_id AS uid,
             COUNT(*) AS total,
             COUNT(CASE WHEN type = 'meeting' THEN 1 END) AS meetings,
             COUNT(CASE WHEN type = 'call'    THEN 1 END) AS calls,
             COUNT(CASE WHEN type = 'visit'   THEN 1 END) AS visits,
             COUNT(CASE WHEN type = 'note'    THEN 1 END) AS notes,
             COUNT(DISTINCT customer_id) AS customers
      FROM activities
      WHERE occurred_at >= $1 AND occurred_at <= $2
      GROUP BY created_by_id
    ) a ON a.uid = u.id
    LEFT JOIN (
      SELECT created_by_id AS uid,
             COUNT(*) AS created,
             COUNT(CASE WHEN completed = 1 AND completed_at >= $1 AND completed_at <= $2 THEN 1 END) AS completed
      FROM follow_ups
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY created_by_id
    ) f ON f.uid = u.id
    LEFT JOIN (
      SELECT created_by_id AS uid,
             COUNT(*) AS created,
             COALESCE(SUM(estimated_revenue), 0) AS createdValue
      FROM opportunities
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY created_by_id
    ) o ON o.uid = u.id
    LEFT JOIN (
      SELECT created_by_id AS uid,
             COUNT(CASE WHEN status = 'Won'  THEN 1 END) AS won,
             COALESCE(SUM(CASE WHEN status = 'Won' THEN estimated_revenue ELSE 0 END), 0) AS wonValue,
             COUNT(CASE WHEN status = 'Lost' THEN 1 END) AS lost
      FROM opportunities
      WHERE status IN ('Won','Lost') AND date(close_date) >= date($1) AND date(close_date) <= date($2)
      GROUP BY created_by_id
    ) w ON w.uid = u.id
    WHERE u.analytics_tracked = 1
    ORDER BY u.name COLLATE NOCASE
    `,
    [start, end]
  );

  return rows.map((r) => {
    const completionPct = r.followupsCreated > 0
      ? Math.round((r.followupsCompleted / r.followupsCreated) * 100)
      : 0;
    const closed = r.oppsWon + r.oppsLost;
    const winRatePct = closed > 0 ? Math.round((r.oppsWon / closed) * 100) : null;
    return {
      ...r,
      followupCompletionPct: completionPct,
      winRatePct,
    };
  });
}

// ── Alert cards ─────────────────────────────────────────────────────────────

/** Tracked users with zero activities in the given range. */
export async function queryZeroActivityUsers(range: AnalyticsRange): Promise<ZeroActivityUser[]> {
  const db = await getDb();
  const rows = await db.select<{
    userId: string;
    userName: string;
    profilePhoto: string | null;
    lastActivityAt: string | null;
  }[]>(
    `
    SELECT u.id AS userId,
           u.name AS userName,
           u.profile_photo AS profilePhoto,
           (SELECT MAX(occurred_at) FROM activities a WHERE a.created_by_id = u.id) AS lastActivityAt
    FROM users u
    WHERE u.analytics_tracked = 1
      AND NOT EXISTS (
        SELECT 1 FROM activities a
        WHERE a.created_by_id = u.id
          AND a.occurred_at >= $1 AND a.occurred_at <= $2
      )
    ORDER BY u.name COLLATE NOCASE
    `,
    [range.start, range.end]
  );
  return rows;
}

/** Per tracked user, count of follow-ups due in the past and not yet completed. */
export async function queryOverdueFollowupsByUser(): Promise<OverdueFollowupSummary[]> {
  const db = await getDb();
  const rows = await db.select<OverdueFollowupSummary[]>(
    `
    SELECT u.id AS userId,
           u.name AS userName,
           u.profile_photo AS profilePhoto,
           COUNT(f.id) AS count
    FROM users u
    JOIN follow_ups f
      ON f.created_by_id = u.id
     AND f.completed = 0
     AND f.due_date < datetime('now')
    WHERE u.analytics_tracked = 1
    GROUP BY u.id, u.name, u.profile_photo
    HAVING count > 0
    ORDER BY count DESC, u.name COLLATE NOCASE
    `
  );
  return rows;
}

// ── Drilldown ───────────────────────────────────────────────────────────────

export async function queryUserDrilldown(userId: string, range: AnalyticsRange): Promise<UserDrilldown> {
  const db = await getDb();
  const { start, end } = range;

  const [timelineRows, followupTimelineRows, opportunityTimelineRows, activities, openOpps, staleCustomers, overdueFollowups, openOppsValueRows] = await Promise.all([
    db.select<{ date: string; type: string; count: number }[]>(
      `SELECT strftime('%Y-%m-%d', occurred_at) AS date, type, COUNT(*) AS count
       FROM activities
       WHERE created_by_id = $1 AND occurred_at >= $2 AND occurred_at <= $3
       GROUP BY date, type
       ORDER BY date`,
      [userId, start, end]
    ),
    db.select<{ date: string; count: number }[]>(
      `SELECT strftime('%Y-%m-%d', created_at) AS date, COUNT(*) AS count
       FROM follow_ups
       WHERE created_by_id = $1 AND created_at >= $2 AND created_at <= $3
       GROUP BY date
       ORDER BY date`,
      [userId, start, end]
    ),
    db.select<{ date: string; count: number }[]>(
      `SELECT strftime('%Y-%m-%d', created_at) AS date, COUNT(*) AS count
       FROM opportunities
       WHERE created_by_id = $1 AND created_at >= $2 AND created_at <= $3
       GROUP BY date
       ORDER BY date`,
      [userId, start, end]
    ),
    db.select<{
      id: string;
      type: string;
      subject: string;
      customerId: string;
      customerName: string;
      occurredAt: string;
    }[]>(
      `SELECT a.id, a.type, a.subject,
              a.customer_id AS customerId,
              c.name AS customerName,
              a.occurred_at AS occurredAt
       FROM activities a
       JOIN customers c ON c.id = a.customer_id
       WHERE a.created_by_id = $1 AND a.occurred_at >= $2 AND a.occurred_at <= $3
       ORDER BY a.occurred_at DESC
       LIMIT 30`,
      [userId, start, end]
    ),
    db.select<{
      id: string;
      subject: string;
      customerId: string;
      customerName: string;
      stage: string;
      estimatedRevenue: number | null;
      expirationDate: string | null;
      probability: number;
    }[]>(
      `SELECT o.id, o.subject,
              o.customer_id AS customerId,
              c.name AS customerName,
              o.stage,
              o.estimated_revenue AS estimatedRevenue,
              o.expiration_date  AS expirationDate,
              o.probability
       FROM opportunities o
       JOIN customers c ON c.id = o.customer_id
       WHERE o.created_by_id = $1 AND o.status = 'Open'
       ORDER BY o.expiration_date IS NULL, o.expiration_date ASC, o.estimated_revenue DESC NULLS LAST
       LIMIT 50`,
      [userId]
    ),
    db.select<{ id: string; name: string; lastActivityAt: string | null; daysSince: number | null }[]>(
      `SELECT c.id, c.name,
              c.last_activity_at AS lastActivityAt,
              CAST(julianday('now') - julianday(c.last_activity_at) AS INTEGER) AS daysSince
       FROM customers c
       WHERE (c.owner_id = $1 OR c.aws_owner_id = $1 OR c.azure_owner_id = $1 OR c.customer_success_manager_id = $1)
         AND (c.last_activity_at IS NULL OR c.last_activity_at < datetime('now', '-60 days'))
       ORDER BY c.last_activity_at IS NULL DESC, c.last_activity_at ASC
       LIMIT 25`,
      [userId]
    ),
    db.select<{
      id: string;
      title: string;
      customerId: string;
      customerName: string;
      dueDate: string;
      daysOverdue: number;
    }[]>(
      `SELECT f.id, f.title,
              f.customer_id AS customerId,
              c.name AS customerName,
              f.due_date AS dueDate,
              CAST(julianday('now') - julianday(f.due_date) AS INTEGER) AS daysOverdue
       FROM follow_ups f
       JOIN customers c ON c.id = f.customer_id
       WHERE f.created_by_id = $1
         AND f.completed = 0
         AND f.due_date < datetime('now')
       ORDER BY f.due_date ASC
       LIMIT 25`,
      [userId]
    ),
    db.select<{ total: number }[]>(
      `SELECT COALESCE(SUM(estimated_revenue), 0) AS total
       FROM opportunities
       WHERE created_by_id = $1 AND status = 'Open'`,
      [userId]
    ),
  ]);

  // Build a complete timeline so the chart has every day in range (zero-filled gaps)
  const timeline = buildContinuousTimeline(start, end, timelineRows, followupTimelineRows, opportunityTimelineRows);

  return {
    userId,
    timeline,
    recentActivities: activities.map((a) => ({
      id: a.id,
      type: a.type as DrilldownActivity['type'],
      subject: a.subject,
      customerId: a.customerId,
      customerName: a.customerName,
      occurredAt: a.occurredAt,
    })),
    openOpps: openOpps as DrilldownOpenOpp[],
    openOppsValue: openOppsValueRows[0]?.total ?? 0,
    staleCustomers: staleCustomers as DrilldownStaleCustomer[],
    overdueFollowups: overdueFollowups as DrilldownOverdueFollowup[],
  };
}

function buildContinuousTimeline(
  startIso: string,
  endIso: string,
  rows: { date: string; type: string; count: number }[],
  followupRows: { date: string; count: number }[],
  opportunityRows: { date: string; count: number }[]
): DrilldownTimelinePoint[] {
  const start = new Date(startIso);
  const end = new Date(endIso);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const map = new Map<string, DrilldownTimelinePoint>();
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split('T')[0];
    map.set(key, { date: key, meeting: 0, call: 0, visit: 0, note: 0, followup: 0, opportunity: 0 });
  }
  for (const { date, type, count } of rows) {
    const point = map.get(date);
    if (!point) continue;
    if (type === 'meeting' || type === 'call' || type === 'visit' || type === 'note') {
      point[type] = count;
    }
  }
  for (const { date, count } of followupRows) {
    const point = map.get(date);
    if (point) point.followup = count;
  }
  for (const { date, count } of opportunityRows) {
    const point = map.get(date);
    if (point) point.opportunity = count;
  }
  return Array.from(map.values());
}
