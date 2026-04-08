import { isOnline, isTauriApp } from '@/lib/utils/offlineUtils';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { d365Request } from '@/lib/auth/msalConfig';
import { getD365Adapter } from '@/lib/sync/d365Adapter';
import { markActivitySynced } from '@/lib/db/queries/activities';
import { markFollowUpSynced } from '@/lib/db/queries/followups';
import { markOpportunitySynced } from '@/lib/db/queries/opportunities';
import { queryContactPhone } from '@/lib/db/queries/contacts';
import { queryOptionSetValue } from '@/lib/db/queries/optionSets';
import type { Activity, FollowUp, Opportunity } from '@/types/entities';
import type { OpportunityOptionValues } from '@/lib/sync/d365Adapter';

async function tryDirectPush<T>(
  pushFn: (token: string) => Promise<T>,
): Promise<{ success: true; result: T } | { success: false }> {
  if (!isOnline()) {
    console.warn('[sync] Direct push skipped: offline');
    return { success: false };
  }
  if (!isTauriApp()) {
    console.warn('[sync] Direct push skipped: not Tauri app');
    return { success: false };
  }
  try {
    const token = await getAccessToken(d365Request.scopes);
    if (!token) {
      console.warn('[sync] Direct push skipped: no access token');
      return { success: false };
    }
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
  } catch (err) {
    console.error('[sync] getCallerD365Id via WhoAmI failed:', err instanceof Error ? err.message : err);
    return undefined;
  }
}

export async function directPushActivity(
  activity: Activity,
): Promise<{ remoteId: string } | null> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    const d365Id = await getCallerD365Id(token);
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

async function resolveOpportunityOptionValues(opportunity: Opportunity): Promise<OpportunityOptionValues> {
  const [stage, sellType, opportunityType, recordType, source] = await Promise.all([
    opportunity.stage ? queryOptionSetValue('opportunity', 'im360_oppstage', opportunity.stage) : Promise.resolve(null),
    opportunity.sellType ? queryOptionSetValue('opportunity', 'im360_opptype', opportunity.sellType) : Promise.resolve(null),
    opportunity.opportunityType ? queryOptionSetValue('opportunity', 'im360_drpboxopptype', opportunity.opportunityType) : Promise.resolve(null),
    opportunity.recordType ? queryOptionSetValue('opportunity', 'im360_recordtype', opportunity.recordType) : Promise.resolve(null),
    opportunity.source ? queryOptionSetValue('opportunity', 'im360_source', opportunity.source) : Promise.resolve(null),
  ]);
  return { stage, sellType, opportunityType, recordType, source };
}

export async function directPushOpportunity(
  opportunity: Opportunity,
): Promise<{ remoteId: string } | null> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    const optionValues = await resolveOpportunityOptionValues(opportunity);
    return adapter.pushOpportunity(token, opportunity, optionValues);
  });

  if (result.success) {
    await markOpportunitySynced(opportunity.id, result.result);
    return { remoteId: result.result };
  }
  return null;
}

export async function directDeleteOpportunity(remoteId: string): Promise<boolean> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    await adapter.deleteOpportunity(token, remoteId);
  });
  return result.success;
}
