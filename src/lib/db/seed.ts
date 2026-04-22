import type Database from '@tauri-apps/plugin-sql';
import { mockCustomers } from '@/lib/mock/customers';
import { mockContacts } from '@/lib/mock/contacts';
import { mockActivities } from '@/lib/mock/activities';
import { mockFollowUps } from '@/lib/mock/followups';
import { mockOpportunities } from '@/lib/mock/opportunities';
import { mockUsers, mockSyncRecords } from '@/lib/mock/admin';

async function seedCustomers(db: Database): Promise<void> {
  for (const c of mockCustomers) {
    await db.execute(
      `INSERT OR IGNORE INTO customers (id,name,account_number,industry,segment,owner_id,owner_name,phone,email,address_street,address_city,address_country,website,reseller_id,bcn,cloud_customer,arr,status,last_activity_at,synced_at,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
      [c.id,c.name,c.accountNumber,c.industry,c.segment,c.ownerId,c.ownerName,c.phone,c.email,c.addressStreet,c.addressCity,c.addressCountry,c.website,c.resellerId,c.bcn,c.cloudCustomer?1:0,c.arr,c.status,c.lastActivityAt,c.syncedAt,c.createdAt,c.updatedAt]
    );
  }
}

async function seedContacts(db: Database): Promise<void> {
  for (const c of mockContacts) {
    await db.execute(
      `INSERT OR IGNORE INTO contacts (id,customer_id,first_name,last_name,job_title,email,phone,mobile,notes,synced_at,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [c.id,c.customerId,c.firstName,c.lastName,c.jobTitle,c.email,c.phone,c.mobile,c.notes,c.syncedAt,c.createdAt,c.updatedAt]
    );
  }
}

async function seedActivities(db: Database): Promise<void> {
  for (const a of mockActivities) {
    await db.execute(
      `INSERT OR IGNORE INTO activities (id,customer_id,contact_id,type,subject,description,occurred_at,created_by_id,created_by_name,sync_status,remote_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [a.id,a.customerId,a.contactId,a.type,a.subject,a.description,a.occurredAt,a.createdById,a.createdByName,a.syncStatus,a.remoteId,a.createdAt,a.updatedAt]
    );
  }
}

async function seedFollowUps(db: Database): Promise<void> {
  for (const f of mockFollowUps) {
    await db.execute(
      `INSERT OR IGNORE INTO follow_ups (id,customer_id,activity_id,title,description,due_date,completed,completed_at,created_by_id,created_by_name,sync_status,remote_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [f.id,f.customerId,f.activityId,f.title,f.description,f.dueDate,f.completed?1:0,f.completedAt,f.createdById,f.createdByName,f.syncStatus,f.remoteId,f.createdAt,f.updatedAt]
    );
  }
}

async function seedOpportunities(db: Database): Promise<void> {
  for (const o of mockOpportunities) {
    await db.execute(
      `INSERT OR IGNORE INTO opportunities (id,customer_id,contact_id,status,subject,bcn,multi_vendor_opportunity,sell_type,primary_vendor,opportunity_type,stage,probability,expiration_date,estimated_revenue,currency,country,source,record_type,customer_need,sync_status,remote_id,created_by_id,created_by_name,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
      [o.id,o.customerId,o.contactId,o.status,o.subject,o.bcn,o.multiVendorOpportunity?1:0,o.sellType,o.primaryVendor,o.opportunityType,o.stage,o.probability,o.expirationDate,o.estimatedRevenue,o.currency,o.country,o.source,o.recordType,o.customerNeed,o.syncStatus,o.remoteId,o.createdById,o.createdByName,o.createdAt,o.updatedAt]
    );
  }
}

async function seedUsers(db: Database): Promise<void> {
  for (const u of mockUsers) {
    await db.execute(
      `INSERT OR IGNORE INTO users (id,email,name,role,business_unit,last_active_at,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [u.id,u.email,u.name,u.role,u.businessUnit,u.lastActiveAt,u.createdAt,u.updatedAt]
    );
  }
}

async function seedSyncRecords(db: Database): Promise<void> {
  for (const s of mockSyncRecords) {
    await db.execute(
      `INSERT OR IGNORE INTO sync_records (id,sync_type,status,started_at,finished_at,records_pulled,records_pushed,error_message,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [s.id,s.syncType,s.status,s.startedAt,s.finishedAt,s.recordsPulled,s.recordsPushed,s.errorMessage,s.createdAt]
    );
  }
}

const TABLE_SEEDERS: Record<string, (db: Database) => Promise<void>> = {
  customers: seedCustomers,
  contacts: seedContacts,
  activities: seedActivities,
  follow_ups: seedFollowUps,
  opportunities: seedOpportunities,
  users: seedUsers,
  sync_records: seedSyncRecords,
};

export async function seedMockData(db: Database): Promise<void> {
  console.log('[seed] Seeding mock data...');
  for (const seeder of Object.values(TABLE_SEEDERS)) {
    await seeder(db);
  }
  console.log('[seed] Mock data seeded successfully.');
}

export async function seedMissingTables(db: Database, tables: string[]): Promise<void> {
  for (const table of tables) {
    const seeder = TABLE_SEEDERS[table];
    if (seeder) {
      console.log(`[seed] Seeding missing table: ${table}`);
      await seeder(db);
    }
  }
}
