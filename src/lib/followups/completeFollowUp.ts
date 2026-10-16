import { isTauriApp } from '@/lib/utils/offlineUtils';
import { completeFollowUp as dbCompleteFollowUp } from '@/lib/db/queries/followups';
import { directPushFollowUp } from '@/lib/sync/directPushService';
import { notifyPush } from '@/lib/sync/pushToast';
import { emitDataEvent } from '@/lib/dataEvents';
import { useFollowUpStore } from '@/store/followUpStore';
import type { FollowUp } from '@/types/entities';

/**
 * Marks a follow-up complete locally, pushes it to Dynamics 365 in the background
 * and notifies listeners. Returns the locally updated follow-up.
 */
export async function completeFollowUpEverywhere(
  target: FollowUp,
  onSynced?: (remoteId: string) => void,
): Promise<FollowUp> {
  const now = new Date().toISOString();
  const updated: FollowUp = { ...target, completed: true, completedAt: now, syncStatus: 'pending' };
  if (isTauriApp()) {
    await dbCompleteFollowUp(target.id);
    notifyPush(() => directPushFollowUp(updated), {
      entity: 'follow-up',
      action: 'marked complete',
      label: target.title,
      onSuccess: (remoteId) => {
        onSynced?.(remoteId);
        emitDataEvent('followup', 'updated', target.customerId);
      },
    });
  }
  useFollowUpStore.getState().markComplete(target.id);
  emitDataEvent('followup', 'completed', target.customerId);
  return updated;
}
