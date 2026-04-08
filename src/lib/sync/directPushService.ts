import { isOnline, isTauriApp } from '@/lib/utils/offlineUtils';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { d365Request } from '@/lib/auth/msalConfig';
import { getD365Adapter } from '@/lib/sync/d365Adapter';
import { markActivitySynced } from '@/lib/db/queries/activities';
import { markFollowUpSynced } from '@/lib/db/queries/followups';
import { queryContactPhone } from '@/lib/db/queries/contacts';
import type { Activity, FollowUp } from '@/types/entities';

async function tryDirectPush<T>(
  pushFn: (token: string) => Promise<T>,
): Promise<{ success: true; result: T } | { success: false }> {
  if (!isOnline() || !isTauriApp()) {
    return { success: false };
  }
  try {
    const token = await getAccessToken(d365Request.scopes);
    if (!token) return { success: false };
    const result = await pushFn(token);
    return { success: true, result };
  } catch (err) {
    console.warn('[sync] Direct push failed, will sync later:', err instanceof Error ? err.message : err);
    return { success: false };
  }
}

let cachedCallerD365Id: string | null = null;

async function getCallerD365Id(token: string): Promise<string | undefined> {
  if (cachedCallerD365Id) return cachedCallerD365Id;
  try {
    const adapter = getD365Adapter();
    cachedCallerD365Id = await adapter.whoAmI(token);
    return cachedCallerD365Id;
  } catch {
    return undefined;
  }
}

export async function directPushActivity(
  activity: Activity,
  callerD365Id?: string | null,
): Promise<{ remoteId: string } | null> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    const d365Id = callerD365Id ?? await getCallerD365Id(token);
    const contactPhone = activity.contactId ? await queryContactPhone(activity.contactId) : null;
    return adapter.pushActivity(token, activity, d365Id, contactPhone);
  });

  if (result.success) {
    await markActivitySynced(activity.id, result.result);
    return { remoteId: result.result };
  }
  return null;
}

export async function directPushFollowUp(
  followUp: FollowUp,
): Promise<{ remoteId: string } | null> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    return adapter.pushFollowUp(token, followUp);
  });

  if (result.success) {
    await markFollowUpSynced(followUp.id, result.result);
    return { remoteId: result.result };
  }
  return null;
}

export async function directDeleteActivity(
  remoteId: string,
  type: string,
): Promise<boolean> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    await adapter.deleteActivity(token, remoteId, type);
  });
  return result.success;
}

export async function directDeleteFollowUp(
  remoteId: string,
): Promise<boolean> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    await adapter.deleteFollowUp(token, remoteId);
  });
  return result.success;
}
