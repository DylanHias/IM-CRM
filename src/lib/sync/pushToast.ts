import { toast } from 'sonner';
import type { DirectPushResult } from '@/lib/sync/directPushService';

interface NotifyOptions {
  /** Singular noun shown in toasts ("activity", "follow-up", "opportunity"). */
  entity: string;
  /** Action label shown on success ("created", "updated", "completed", "closed as won", etc). */
  action: string;
  /** Short label of the record itself (e.g. subject / title) shown in the loading toast. */
  label?: string;
  /** Called after the push resolves with the remoteId on success. */
  onSuccess?: (remoteId: string) => void;
}

/** Fire a directPush* call and show loading → success/error toasts. */
export function notifyPush(
  pushFn: () => Promise<DirectPushResult>,
  { entity, action, label, onSuccess }: NotifyOptions,
): Promise<DirectPushResult> {
  const head = label ? `Saving "${label}" to Dynamics 365…` : `Saving ${entity} to Dynamics 365…`;
  const toastId = toast.loading(head);
  const promise = pushFn();
  promise.then((result) => {
    if (result && 'remoteId' in result) {
      toast.success(`${capitalize(entity)} ${action} in Dynamics 365`, { id: toastId });
      onSuccess?.(result.remoteId);
    } else if (result && 'error' in result) {
      toast.error(`Could not push ${entity} to Dynamics 365`, {
        id: toastId,
        description: result.error,
      });
    } else {
      toast.error(`Could not push ${entity} to Dynamics 365`, {
        id: toastId,
        description: 'Unknown error — check the logs',
      });
    }
  });
  return promise;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
