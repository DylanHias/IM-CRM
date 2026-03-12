import type Database from '@tauri-apps/plugin-sql';
import { mockCustomers } from '@/lib/mock/customers';
import { mockContacts } from '@/lib/mock/contacts';
import { mockActivities } from '@/lib/mock/activities';
import { mockTrainings } from '@/lib/mock/trainings';
import { mockFollowUps } from '@/lib/mock/followups';

export async function seedMockData(db: Database): Promise<void> {
  console.log('[seed] Seeding mock data...');

  for (const c of mockCustomers) {
    await db.execute(
      `INSERT OR IGNORE INTO customers (id,name,account_number,industry,segment,owner_id,owner_name,phone,email,address_street,address_city,address_country,website,status,last_activity_at,synced_at,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [c.id,c.name,c.accountNumber,c.industry,c.segment,c.ownerId,c.ownerName,c.phone,c.email,c.addressStreet,c.addressCity,c.addressCountry,c.website,c.status,c.lastActivityAt,c.syncedAt,c.createdAt,c.updatedAt]
    );
  }

  for (const c of mockContacts) {
    await db.execute(
      `INSERT OR IGNORE INTO contacts (id,customer_id,first_name,last_name,job_title,email,phone,mobile,notes,synced_at,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [c.id,c.customerId,c.firstName,c.lastName,c.jobTitle,c.email,c.phone,c.mobile,c.notes,c.syncedAt,c.createdAt,c.updatedAt]
    );
  }

  for (const a of mockActivities) {
    await db.execute(
      `INSERT OR IGNORE INTO activities (id,customer_id,contact_id,type,subject,description,occurred_at,created_by_id,created_by_name,sync_status,remote_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [a.id,a.customerId,a.contactId,a.type,a.subject,a.description,a.occurredAt,a.createdById,a.createdByName,a.syncStatus,a.remoteId,a.createdAt,a.updatedAt]
    );
  }

  for (const t of mockTrainings) {
    await db.execute(
      `INSERT OR IGNORE INTO trainings (id,customer_id,title,training_date,participant,provider,status,synced_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [t.id,t.customerId,t.title,t.trainingDate,t.participant,t.provider,t.status,t.syncedAt,t.createdAt]
    );
  }

  for (const f of mockFollowUps) {
    await db.execute(
      `INSERT OR IGNORE INTO follow_ups (id,customer_id,activity_id,title,description,due_date,completed,completed_at,created_by_id,created_by_name,sync_status,remote_id,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [f.id,f.customerId,f.activityId,f.title,f.description,f.dueDate,f.completed?1:0,f.completedAt,f.createdById,f.createdByName,f.syncStatus,f.remoteId,f.createdAt,f.updatedAt]
    );
  }

  console.log('[seed] Mock data seeded successfully.');
}
