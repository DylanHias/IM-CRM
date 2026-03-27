import { getDb } from '@/lib/db/client';
import type { Opportunity } from '@/types/entities';
import type { OpportunityRow } from '@/types/db';
import { logAudit } from '@/lib/db/auditHelper';

function rowToOpportunity(row: OpportunityRow): Opportunity {
  return {
    id: row.id,
    customerId: row.customer_id,
    contactId: row.contact_id,
    status: row.status as Opportunity['status'],
    subject: row.subject,
    bcn: row.bcn,
    multiVendorOpportunity: row.multi_vendor_opportunity === 1,
    sellType: row.sell_type as Opportunity['sellType'],
    primaryVendor: row.primary_vendor as Opportunity['primaryVendor'],
    opportunityType: row.opportunity_type as Opportunity['opportunityType'],
    stage: row.stage as Opportunity['stage'],
    probability: row.probability,
    expirationDate: row.expiration_date,
    estimatedRevenue: row.estimated_revenue,
    currency: row.currency,
    country: row.country,
    source: row.source,
    recordType: row.record_type,
    customerNeed: row.customer_need,
    syncStatus: row.sync_status as Opportunity['syncStatus'],
    remoteId: row.remote_id,
    createdById: row.created_by_id,
    createdByName: row.created_by_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function queryOpportunitiesByCustomer(customerId: string): Promise<Opportunity[]> {
  const db = await getDb();
  const rows = await db.select<OpportunityRow[]>(
    `SELECT * FROM opportunities WHERE customer_id = $1 ORDER BY created_at DESC`,
    [customerId]
  );
  return rows.map(rowToOpportunity);
}

export async function queryAllOpportunities(): Promise<Opportunity[]> {
  const db = await getDb();
  const rows = await db.select<OpportunityRow[]>(
    `SELECT * FROM opportunities ORDER BY created_at DESC`
  );
  return rows.map(rowToOpportunity);
}

export async function insertOpportunity(opp: Opportunity): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO opportunities (
      id, customer_id, contact_id, status, subject, bcn, multi_vendor_opportunity,
      sell_type, primary_vendor, opportunity_type, stage, probability,
      expiration_date, estimated_revenue, currency, country, source, record_type,
      customer_need, sync_status, remote_id, created_by_id, created_by_name,
      created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
    [
      opp.id, opp.customerId, opp.contactId, opp.status, opp.subject, opp.bcn,
      opp.multiVendorOpportunity ? 1 : 0, opp.sellType, opp.primaryVendor,
      opp.opportunityType, opp.stage, opp.probability, opp.expirationDate,
      opp.estimatedRevenue, opp.currency, opp.country, opp.source, opp.recordType,
      opp.customerNeed, opp.syncStatus, opp.remoteId, opp.createdById,
      opp.createdByName, opp.createdAt, opp.updatedAt,
    ]
  );
  logAudit('opportunity', opp.id, 'create', opp.createdById, opp.createdByName, null, { subject: opp.subject, stage: opp.stage });
}

export async function updateOpportunity(opp: Opportunity): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE opportunities SET
      contact_id=$1, status=$2, subject=$3, bcn=$4, multi_vendor_opportunity=$5,
      sell_type=$6, primary_vendor=$7, opportunity_type=$8, stage=$9, probability=$10,
      expiration_date=$11, estimated_revenue=$12, currency=$13, country=$14,
      source=$15, record_type=$16, customer_need=$17, sync_status='pending',
      updated_at=$18
    WHERE id=$19`,
    [
      opp.contactId, opp.status, opp.subject, opp.bcn,
      opp.multiVendorOpportunity ? 1 : 0, opp.sellType, opp.primaryVendor,
      opp.opportunityType, opp.stage, opp.probability, opp.expirationDate,
      opp.estimatedRevenue, opp.currency, opp.country, opp.source, opp.recordType,
      opp.customerNeed, new Date().toISOString(), opp.id,
    ]
  );
  logAudit('opportunity', opp.id, 'update', opp.createdById, opp.createdByName, null, { subject: opp.subject, stage: opp.stage, status: opp.status });
}

export async function queryUniqueVendors(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.select<{ primary_vendor: string }[]>(
    `SELECT DISTINCT primary_vendor FROM opportunities WHERE primary_vendor IS NOT NULL AND primary_vendor != '' ORDER BY primary_vendor`
  );
  return rows.map((r) => r.primary_vendor);
}

export async function deleteOpportunity(id: string): Promise<void> {
  const db = await getDb();
  const rows = await db.select<OpportunityRow[]>(`SELECT * FROM opportunities WHERE id=$1`, [id]);
  await db.execute(`DELETE FROM opportunities WHERE id=$1`, [id]);
  if (rows[0]) {
    logAudit('opportunity', id, 'delete', rows[0].created_by_id, rows[0].created_by_name, { subject: rows[0].subject }, null);
  }
}
