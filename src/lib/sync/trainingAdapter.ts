import type { Training } from '@/types/entities';
import { mockTrainings } from '@/lib/mock/trainings';

export interface ITrainingAdapter {
  fetchTrainings(token: string): Promise<Training[]>;
}

class MockTrainingAdapter implements ITrainingAdapter {
  async fetchTrainings(_token: string): Promise<Training[]> {
    await new Promise((r) => setTimeout(r, 500));
    return mockTrainings.map((t) => ({ ...t, syncedAt: new Date().toISOString() }));
  }
}

// class RealTrainingAdapter implements ITrainingAdapter {
//   async fetchTrainings(token: string): Promise<Training[]> {
//     const res = await fetch(
//       `${process.env.NEXT_PUBLIC_TRAINING_API_URL}/trainings`,
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     const json: TrainingApiResponse = await res.json();
//     return json.data.map(mapTrainingApiToTraining);
//   }
// }

export function getTrainingAdapter(): ITrainingAdapter {
  return new MockTrainingAdapter();
}
