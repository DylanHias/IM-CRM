import { getDb } from '@/lib/db/client';
import type { Opportunity } from '@/types/entities';
import type { OpportunityRow } from '@/types/db';


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
    singleOrCrossSell: row.single_or_cross_sell ?? null,
    estimatedMRR: row.estimated_mrr ?? null,
    annualRevenue: row.annual_revenue ?? null,
    apnId: row.apn_id ?? null,
    awsPartnerType: row.aws_partner_type ?? null,
    awsServiceType: row.aws_service_type ?? null,
    apnTagging: row.apn_tagging ?? null,
    endUserType: row.end_user_type ?? null,
    supportType: row.support_type ?? null,
    payerAccount: row.payer_account ?? null,
    existingPayeeAccount: row.existing_payee_account ?? null,
    consolidationAcceptanceDate: row.consolidation_acceptance_date ?? null,
    msCspTenant: row.ms_csp_tenant ?? null,
    mpnId: row.mpn_id ?? null,
    migrationType: row.migration_type ?? null,
    serviceName: row.service_name ?? null,
    competitiveWinback: row.competitive_winback == null
      ? null
      : typeof row.competitive_winback === 'string'
        ? row.competitive_winback
        : (row.competitive_winback === 1 ? 'Yes' : 'No'),
    publicSectorSegment: row.public_sector_segment ?? null,
    statusReason: row.status_reason ?? null,
    actualRevenue: row.actual_revenue ?? null,
    closeDate: row.close_date ?? null,
    competitorId: row.competitor_id ?? null,
    closeDescription: row.close_description ?? null,
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

export async function queryStaleOpportunityCount(staleDays: number, userId?: string, altUserId?: string): Promise<number> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - staleDays * 86400000).toISOString();
  if (userId && altUserId && altUserId !== userId) {
    const rows = await db.select<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM opportunities WHERE status = 'Open' AND updated_at < $1 AND created_by_id IN ($2, $3)`,
      [cutoff, userId, altUserId]
    );
    return rows[0]?.count ?? 0;
  }
  if (userId) {
    const rows = await db.select<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM opportunities WHERE status = 'Open' AND updated_at < $1 AND created_by_id = $2`,
      [cutoff, userId]
    );
    return rows[0]?.count ?? 0;
  }
  return 0;
}

export async function insertOpportunity(opp: Opportunity): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO opportunities (
      id, customer_id, contact_id, status, subject, bcn, multi_vendor_opportunity,
      sell_type, primary_vendor, opportunity_type, stage, probability,
      expiration_date, estimated_revenue, currency, country, source, record_type,
      customer_need, sync_status, remote_id, created_by_id, created_by_name,
      created_at, updated_at,
      single_or_cross_sell, estimated_mrr, annual_revenue,
      apn_id, aws_partner_type, aws_service_type, apn_tagging, end_user_type,
      support_type, payer_account, existing_payee_account, consolidation_acceptance_date,
      ms_csp_tenant, mpn_id, migration_type, service_name, competitive_winback,
      public_sector_segment, status_reason, actual_revenue, close_date,
      competitor_id, close_description
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,
              $26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48)`,
    [
      opp.id, opp.customerId, opp.contactId, opp.status, opp.subject, opp.bcn,
      opp.multiVendorOpportunity ? 1 : 0, opp.sellType, opp.primaryVendor,
      opp.opportunityType, opp.stage, opp.probability, opp.expirationDate,
      opp.estimatedRevenue, opp.currency, opp.country, opp.source, opp.recordType,
      opp.customerNeed, opp.syncStatus, opp.remoteId, opp.createdById,
      opp.createdByName, opp.createdAt, opp.updatedAt,
      opp.singleOrCrossSell, opp.estimatedMRR, opp.annualRevenue,
      opp.apnId, opp.awsPartnerType, opp.awsServiceType, opp.apnTagging, opp.endUserType,
      opp.supportType, opp.payerAccount, opp.existingPayeeAccount, opp.consolidationAcceptanceDate,
      opp.msCspTenant, opp.mpnId, opp.migrationType, opp.serviceName,
      opp.competitiveWinback,
      opp.publicSectorSegment, opp.statusReason, opp.actualRevenue, opp.closeDate,
      opp.competitorId, opp.closeDescription,
    ]
  );
}

export async function updateOpportunity(opp: Opportunity): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE opportunities SET
      contact_id=$1, status=$2, subject=$3, bcn=$4, multi_vendor_opportunity=$5,
      sell_type=$6, primary_vendor=$7, opportunity_type=$8, stage=$9, probability=$10,
      expiration_date=$11, estimated_revenue=$12, currency=$13, country=$14,
      source=$15, record_type=$16, customer_need=$17, sync_status='pending',
      updated_at=$18,
      single_or_cross_sell=$19, estimated_mrr=$20, annual_revenue=$21,
      apn_id=$22, aws_partner_type=$23, aws_service_type=$24, apn_tagging=$25,
      end_user_type=$26, support_type=$27, payer_account=$28,
      existing_payee_account=$29, consolidation_acceptance_date=$30,
      ms_csp_tenant=$31, mpn_id=$32, migration_type=$33, service_name=$34,
      competitive_winback=$35, public_sector_segment=$36,
      status_reason=$37, actual_revenue=$38, close_date=$39,
      competitor_id=$40, close_description=$41
    WHERE id=$42`,
    [
      opp.contactId, opp.status, opp.subject, opp.bcn,
      opp.multiVendorOpportunity ? 1 : 0, opp.sellType, opp.primaryVendor,
      opp.opportunityType, opp.stage, opp.probability, opp.expirationDate,
      opp.estimatedRevenue, opp.currency, opp.country, opp.source, opp.recordType,
      opp.customerNeed, new Date().toISOString(),
      opp.singleOrCrossSell, opp.estimatedMRR, opp.annualRevenue,
      opp.apnId, opp.awsPartnerType, opp.awsServiceType, opp.apnTagging,
      opp.endUserType, opp.supportType, opp.payerAccount,
      opp.existingPayeeAccount, opp.consolidationAcceptanceDate,
      opp.msCspTenant, opp.mpnId, opp.migrationType, opp.serviceName,
      opp.competitiveWinback,
      opp.publicSectorSegment, opp.statusReason, opp.actualRevenue, opp.closeDate,
      opp.competitorId, opp.closeDescription, opp.id,
    ]
  );
}

export async function queryUniqueVendors(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.select<{ primary_vendor: string }[]>(
    `SELECT DISTINCT primary_vendor FROM opportunities WHERE primary_vendor IS NOT NULL AND primary_vendor != '' ORDER BY primary_vendor`
  );
  return rows.map((r) => r.primary_vendor);
}

export async function deleteOpportunity(id: string): Promise<{ remoteId: string | null } | null> {
  const db = await getDb();
  const rows = await db.select<OpportunityRow[]>(`SELECT * FROM opportunities WHERE id=$1`, [id]);
  await db.execute(`DELETE FROM opportunities WHERE id=$1`, [id]);
  if (rows[0]) return { remoteId: rows[0].remote_id };
  return null;
}

export async function queryPendingOpportunities(): Promise<Opportunity[]> {
  const db = await getDb();
  const rows = await db.select<OpportunityRow[]>(
    `SELECT * FROM opportunities WHERE sync_status = 'pending' ORDER BY created_at`
  );
  return rows.map(rowToOpportunity);
}

export async function markOpportunitySynced(id: string, remoteId: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE opportunities SET sync_status = 'synced', remote_id = $1, updated_at = $2 WHERE id = $3`,
    [remoteId, new Date().toISOString(), id]
  );
}

export async function markOpportunitySyncError(id: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE opportunities SET sync_status = 'error', updated_at = $1 WHERE id = $2`,
    [new Date().toISOString(), id]
  );
}

/** Load remote_id → {localId, syncStatus} map for all D365-pulled opportunities. One query replaces N per-record SELECTs. */
export async function preloadOpportunityState(): Promise<Map<string, { localId: string; syncStatus: string }>> {
  const db = await getDb();
  const rows = await db.select<{ id: string; remote_id: string; sync_status: string }[]>(
    `SELECT id, remote_id, sync_status FROM opportunities WHERE remote_id IS NOT NULL`,
  );
  const map = new Map<string, { localId: string; syncStatus: string }>();
  for (const row of rows) {
    map.set(row.remote_id, { localId: row.id, syncStatus: row.sync_status });
  }
  return map;
}

/**
 * Bulk upsert opportunities fetched from D365.
 * - Filters out-of-scope records in memory.
 * - Multi-value INSERT for new records (39 rows/batch).
 * - Individual UPDATE for existing records.
 */
export async function bulkUpsertOpportunities(
  opps: Opportunity[],
  customerIdSet: Set<string>,
  contactIdSet: Set<string>,
  existing: Map<string, { localId: string; syncStatus: string }>,
): Promise<{ inserted: number; updated: number; skipped: number; errors: number }> {
  if (opps.length === 0) return { inserted: 0, updated: 0, skipped: 0, errors: 0 };
  const db = await getDb();

  const toInsert: Opportunity[] = [];
  const toUpdate: Opportunity[] = [];
  let skipped = 0;

  for (const opp of opps) {
    if (!customerIdSet.has(opp.customerId)) { skipped++; continue; }
    const contactId = opp.contactId && contactIdSet.has(opp.contactId) ? opp.contactId : null;
    const mapped: Opportunity = contactId !== opp.contactId ? { ...opp, contactId } : opp;
    const prev = opp.remoteId ? existing.get(opp.remoteId) : undefined;
    if (prev) {
      if (prev.syncStatus === 'pending') { skipped++; continue; }
      toUpdate.push(mapped);
    } else {
      toInsert.push(mapped);
    }
  }

  const COLS = 48;
  const CHUNK = Math.floor(999 / COLS); // ~20 rows per batch
  let inserted = 0;
  let errors = 0;

  const insertValuesFor = (o: Opportunity): unknown[] => [
    o.id, o.customerId, o.contactId, o.status, o.subject, o.bcn,
    o.multiVendorOpportunity ? 1 : 0, o.sellType, o.primaryVendor,
    o.opportunityType, o.stage, o.probability, o.expirationDate,
    o.estimatedRevenue, o.currency, o.country, o.source, o.recordType,
    o.customerNeed, 'synced', o.remoteId, o.createdById, o.createdByName,
    o.createdAt, o.updatedAt,
    o.singleOrCrossSell, o.estimatedMRR, o.annualRevenue,
    o.apnId, o.awsPartnerType, o.awsServiceType, o.apnTagging, o.endUserType,
    o.supportType, o.payerAccount, o.existingPayeeAccount, o.consolidationAcceptanceDate,
    o.msCspTenant, o.mpnId, o.migrationType, o.serviceName, o.competitiveWinback,
    o.publicSectorSegment, o.statusReason, o.actualRevenue, o.closeDate,
    o.competitorId, o.closeDescription,
  ];

  for (let i = 0; i < toInsert.length; i += CHUNK) {
    const chunk = toInsert.slice(i, i + CHUNK);
    const placeholders = chunk
      .map((_, j) => `(${Array.from({ length: COLS }, (__, k) => `$${j * COLS + k + 1}`).join(',')})`)
      .join(',');
    const values = chunk.flatMap(insertValuesFor);
    try {
      const result = await db.execute(
        `INSERT OR IGNORE INTO opportunities (
          id, customer_id, contact_id, status, subject, bcn, multi_vendor_opportunity,
          sell_type, primary_vendor, opportunity_type, stage, probability,
          expiration_date, estimated_revenue, currency, country, source, record_type,
          customer_need, sync_status, remote_id, created_by_id, created_by_name,
          created_at, updated_at,
          single_or_cross_sell, estimated_mrr, annual_revenue,
          apn_id, aws_partner_type, aws_service_type, apn_tagging, end_user_type,
          support_type, payer_account, existing_payee_account, consolidation_acceptance_date,
          ms_csp_tenant, mpn_id, migration_type, service_name, competitive_winback,
          public_sector_segment, status_reason, actual_revenue, close_date,
          competitor_id, close_description
        ) VALUES ${placeholders}`,
        values,
      );
      inserted += result.rowsAffected;
    } catch (err) {
      console.error('[opportunity] Bulk insert chunk failed:', err instanceof Error ? err.message : err);
      errors++;
    }
  }

  let updated = 0;
  for (const o of toUpdate) {
    try {
      await db.execute(
        `UPDATE opportunities SET
          customer_id=$1, contact_id=$2, status=$3, subject=$4, bcn=$5,
          multi_vendor_opportunity=$6, sell_type=$7, primary_vendor=$8,
          opportunity_type=$9, stage=$10, probability=$11, expiration_date=$12,
          estimated_revenue=$13, currency=$14, country=$15, source=$16, record_type=$17,
          customer_need=$18, sync_status='synced', updated_at=$19,
          single_or_cross_sell=$20, estimated_mrr=$21, annual_revenue=$22,
          apn_id=$23, aws_partner_type=$24, aws_service_type=$25, apn_tagging=$26,
          end_user_type=$27, support_type=$28, payer_account=$29,
          existing_payee_account=$30, consolidation_acceptance_date=$31,
          ms_csp_tenant=$32, mpn_id=$33, migration_type=$34, service_name=$35,
          competitive_winback=$36, public_sector_segment=$37,
          status_reason=$38, actual_revenue=$39, close_date=$40,
          competitor_id=$41, close_description=$42
         WHERE remote_id=$43`,
        [
          o.customerId, o.contactId, o.status, o.subject, o.bcn,
          o.multiVendorOpportunity ? 1 : 0, o.sellType, o.primaryVendor,
          o.opportunityType, o.stage, o.probability, o.expirationDate,
          o.estimatedRevenue, o.currency, o.country, o.source, o.recordType, o.customerNeed,
          o.updatedAt,
          o.singleOrCrossSell, o.estimatedMRR, o.annualRevenue,
          o.apnId, o.awsPartnerType, o.awsServiceType, o.apnTagging,
          o.endUserType, o.supportType, o.payerAccount,
          o.existingPayeeAccount, o.consolidationAcceptanceDate,
          o.msCspTenant, o.mpnId, o.migrationType, o.serviceName,
          o.competitiveWinback, o.publicSectorSegment,
          o.statusReason, o.actualRevenue, o.closeDate,
          o.competitorId, o.closeDescription,
          o.remoteId,
        ],
      );
      updated++;
    } catch (err) {
      console.error(`[opportunity] Failed to update opportunity ${o.remoteId}:`, err instanceof Error ? err.message : err);
      errors++;
    }
  }

  return { inserted, updated, skipped, errors };
}

export async function upsertPulledOpportunity(opp: Opportunity): Promise<boolean> {
  const db = await getDb();

  const existing = await db.select<OpportunityRow[]>(
    `SELECT id, sync_status FROM opportunities WHERE remote_id = $1`,
    [opp.remoteId]
  );
  if (existing.length > 0 && existing[0].sync_status === 'pending') return false;

  const customerExists = await db.select<{ id: string }[]>(
    `SELECT id FROM customers WHERE id = $1`,
    [opp.customerId]
  );
  if (customerExists.length === 0) return false;

  let contactId = opp.contactId;
  if (contactId) {
    const contactExists = await db.select<{ id: string }[]>(
      `SELECT id FROM contacts WHERE id = $1`,
      [contactId]
    );
    if (contactExists.length === 0) contactId = null;
  }

  if (existing.length > 0) {
    await db.execute(
      `UPDATE opportunities SET
        customer_id=$1, contact_id=$2, status=$3, subject=$4, bcn=$5,
        multi_vendor_opportunity=$6, sell_type=$7, primary_vendor=$8,
        opportunity_type=$9, stage=$10, probability=$11, expiration_date=$12,
        estimated_revenue=$13, currency=$14, country=$15, source=$16, record_type=$17,
        customer_need=$18, sync_status='synced', updated_at=$19,
        single_or_cross_sell=$20, estimated_mrr=$21, annual_revenue=$22,
        apn_id=$23, aws_partner_type=$24, aws_service_type=$25, apn_tagging=$26,
        end_user_type=$27, support_type=$28, payer_account=$29,
        existing_payee_account=$30, consolidation_acceptance_date=$31,
        ms_csp_tenant=$32, mpn_id=$33, migration_type=$34, service_name=$35,
        competitive_winback=$36, public_sector_segment=$37,
        status_reason=$38, actual_revenue=$39, close_date=$40,
        competitor_id=$41, close_description=$42
       WHERE remote_id=$43`,
      [
        opp.customerId, contactId, opp.status, opp.subject, opp.bcn,
        opp.multiVendorOpportunity ? 1 : 0, opp.sellType, opp.primaryVendor,
        opp.opportunityType, opp.stage, opp.probability, opp.expirationDate,
        opp.estimatedRevenue, opp.currency, opp.country, opp.source, opp.recordType, opp.customerNeed,
        opp.updatedAt,
        opp.singleOrCrossSell, opp.estimatedMRR, opp.annualRevenue,
        opp.apnId, opp.awsPartnerType, opp.awsServiceType, opp.apnTagging,
        opp.endUserType, opp.supportType, opp.payerAccount,
        opp.existingPayeeAccount, opp.consolidationAcceptanceDate,
        opp.msCspTenant, opp.mpnId, opp.migrationType, opp.serviceName,
        opp.competitiveWinback, opp.publicSectorSegment,
        opp.statusReason, opp.actualRevenue, opp.closeDate,
        opp.competitorId, opp.closeDescription,
        opp.remoteId,
      ]
    );
  } else {
    await db.execute(
      `INSERT INTO opportunities (
        id, customer_id, contact_id, status, subject, bcn, multi_vendor_opportunity,
        sell_type, primary_vendor, opportunity_type, stage, probability,
        expiration_date, estimated_revenue, currency, country, source, record_type,
        customer_need, sync_status, remote_id, created_by_id, created_by_name,
        created_at, updated_at,
        single_or_cross_sell, estimated_mrr, annual_revenue,
        apn_id, aws_partner_type, aws_service_type, apn_tagging, end_user_type,
        support_type, payer_account, existing_payee_account, consolidation_acceptance_date,
        ms_csp_tenant, mpn_id, migration_type, service_name, competitive_winback,
        public_sector_segment, status_reason, actual_revenue, close_date,
        competitor_id, close_description
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,
                $26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48)`,
      [
        opp.id, opp.customerId, contactId, opp.status, opp.subject, opp.bcn,
        opp.multiVendorOpportunity ? 1 : 0, opp.sellType, opp.primaryVendor,
        opp.opportunityType, opp.stage, opp.probability, opp.expirationDate,
        opp.estimatedRevenue, opp.currency, opp.country, opp.source, opp.recordType,
        opp.customerNeed, 'synced', opp.remoteId, opp.createdById, opp.createdByName,
        opp.createdAt, opp.updatedAt,
        opp.singleOrCrossSell, opp.estimatedMRR, opp.annualRevenue,
        opp.apnId, opp.awsPartnerType, opp.awsServiceType, opp.apnTagging, opp.endUserType,
        opp.supportType, opp.payerAccount, opp.existingPayeeAccount, opp.consolidationAcceptanceDate,
        opp.msCspTenant, opp.mpnId, opp.migrationType, opp.serviceName, opp.competitiveWinback,
        opp.publicSectorSegment, opp.statusReason, opp.actualRevenue, opp.closeDate,
        opp.competitorId, opp.closeDescription,
      ]
    );
  }
  return true;
}
