import { toast } from 'sonner';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { deleteActivity as dbDeleteActivity } from '@/lib/db/queries/activities';
import { insertPendingDelete } from '@/lib/db/queries/pendingDeletes';
import { refreshCustomerHealth } from '@/lib/customers/refreshHealth';
import { directDeleteActivity } from '@/lib/sync/directPushService';
import { emitDataEvent } from '@/lib/dataEvents';

/** Deletes an activity locally and in Dynamics 365, queueing the remote delete when it fails. */
export async function deleteActivityEverywhere(id: string, customerId: string): Promise<void> {
  emitDataEvent('activity', 'deleted', customerId);
  if (!isTauriApp()) return;
  const deleted = await dbDeleteActivity(id);
  refreshCustomerHealth(customerId);
  if (!deleted?.remoteId) return;
  const entityType = deleted.type === 'call' ? 'phonecall' : deleted.type === 'note' ? 'annotation' : 'appointment';
  const d365Type = deleted.type === 'call' ? 'call' : deleted.type === 'note' ? 'note' : 'meeting';
  const noun = deleted.type === 'note' ? 'note' : deleted.type;
  const toastId = toast.loading(`Removing ${noun} from Dynamics 365…`);
  const directDeleted = await directDeleteActivity(deleted.remoteId, d365Type);
  if (!directDeleted) {
    await insertPendingDelete(entityType, deleted.remoteId);
    toast.error(`Could not remove ${noun} from Dynamics 365`, { id: toastId, description: 'Queued for retry on next sync' });
  } else {
    toast.success(`${noun.charAt(0).toUpperCase() + noun.slice(1)} removed from Dynamics 365`, { id: toastId });
  }
}
