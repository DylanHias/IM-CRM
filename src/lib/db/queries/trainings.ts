import { getDb } from '@/lib/db/client';
import type { Training } from '@/types/entities';
import type { TrainingRow } from '@/types/db';

function rowToTraining(row: TrainingRow): Training {
  return {
    id: row.id,
    customerId: row.customer_id,
    title: row.title,
    trainingDate: row.training_date,
    participant: row.participant,
    provider: row.provider,
    status: row.status as Training['status'],
    syncedAt: row.synced_at,
    createdAt: row.created_at,
  };
}

export async function queryTrainingsByCustomer(customerId: string): Promise<Training[]> {
  const db = await getDb();
  const rows = await db.select<TrainingRow[]>(
    `SELECT * FROM trainings WHERE customer_id = $1 ORDER BY training_date DESC`,
    [customerId]
  );
  return rows.map(rowToTraining);
}

export async function deleteTraining(id: string): Promise<void> {
  const db = await getDb();
  await db.execute(`DELETE FROM trainings WHERE id=$1`, [id]);
}

export async function upsertTraining(training: Training): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO trainings (
      id, customer_id, title, training_date, participant, provider, status, synced_at, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title, training_date=excluded.training_date,
      participant=excluded.participant, provider=excluded.provider,
      status=excluded.status, synced_at=excluded.synced_at`,
    [
      training.id, training.customerId, training.title, training.trainingDate,
      training.participant, training.provider, training.status,
      training.syncedAt, training.createdAt,
    ]
  );
}
