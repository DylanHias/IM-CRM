import { toast } from 'sonner';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { updateFollowUp as dbUpdateFollowUp, deleteFollowUp as dbDeleteFollowUp } from '@/lib/db/queries/followups';
import { insertPendingDelete } from '@/lib/db/queries/pendingDeletes';
import { directPushFollowUp, directDeleteFollowUp } from '@/lib/sync/directPushService';
import { notifyPush } from '@/lib/sync/pushToast';
import { emitDataEvent } from '@/lib/dataEvents';
import type { FollowUp } from '@/types/entities';

/** Saves an edited follow-up locally and pushes it to Dynamics 365 in the background. */
export async function saveFollowUpEverywhere(updated: FollowUp, onSynced?: (remoteId: string) => void): Promise<void> {
  if (isTauriApp()) {
    await dbUpdateFollowUp(updated);
    notifyPush(() => directPushFollowUp(updated), {
      entity: 'follow-up',
      action: 'updated',
      label: updated.title,
      onSuccess: (remoteId) => onSynced?.(remoteId),
    });
  }
  emitDataEvent('followup', 'updated', updated.customerId);
}

/** Deletes a follow-up locally and in Dynamics 365, queueing the remote delete when it fails. */
export async function deleteFollowUpEverywhere(followUp: FollowUp): Promise<void> {
  if (isTauriApp()) {
    const deleted = await dbDeleteFollowUp(followUp.id);
    if (deleted?.remoteId) {
      const toastId = toast.loading('Removing follow-up from Dynamics 365…');
      const directDeleted = await directDeleteFollowUp(deleted.remoteId);
      if (!directDeleted) {
        await insertPendingDelete('task', deleted.remoteId);
        toast.error('Could not remove follow-up from Dynamics 365', { id: toastId, description: 'Queued for retry on next sync' });
      } else {
        toast.success('Follow-up removed from Dynamics 365', { id: toastId });
      }
    }
  }
  emitDataEvent('followup', 'deleted', followUp.customerId);
}
