import { isOnline, isTauriApp } from '@/lib/utils/offlineUtils';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { d365Request } from '@/lib/auth/msalConfig';
import { getD365Adapter } from '@/lib/sync/d365Adapter';
import { markActivitySynced } from '@/lib/db/queries/activities';
import { markFollowUpSynced } from '@/lib/db/queries/followups';
import { markOpportunitySynced } from '@/lib/db/queries/opportunities';
import { markContactSynced, queryContactPushInfo } from '@/lib/db/queries/contacts';
import { insertPendingDelete } from '@/lib/db/queries/pendingDeletes';
import { queryOptionSetValue } from '@/lib/db/queries/optionSets';
import { queryLookupTableId } from '@/lib/db/queries/lookupTables';
import type { Activity, Contact, FollowUp, Opportunity } from '@/types/entities';
import type { OpportunityOptionValues, OpportunityLookupValues } from '@/lib/sync/d365Adapter';

async function tryDirectPush<T>(
  pushFn: (token: string) => Promise<T>,
): Promise<{ success: true; result: T } | { success: false; error?: string }> {
  if (!isOnline()) {
    console.warn('[sync] Direct push skipped: offline');
    return { success: false, error: 'Offline — will sync when connection returns' };
  }
  if (!isTauriApp()) {
    console.warn('[sync] Direct push skipped: not Tauri app');
    return { success: false, error: 'Not running as Tauri app' };
  }
  try {
    const token = await getAccessToken(d365Request.scopes);
    if (!token) {
      console.warn('[sync] Direct push skipped: no access token');
      return { success: false, error: 'No D365 access token — sign in again' };
    }
    const result = await pushFn(token);
    return { success: true, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[sync] Direct push failed:', message);
    return { success: false, error: message };
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

export type DirectPushResult = { remoteId: string } | { error: string } | null;

export async function directPushActivity(
  activity: Activity,
): Promise<DirectPushResult> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    const d365Id = await getCallerD365Id(token);
    const contactInfo = activity.contactId ? await queryContactPushInfo(activity.contactId) : null;
    return adapter.pushActivity(token, activity, d365Id, contactInfo?.phone ?? null, contactInfo?.remoteId ?? null);
  });

  if (result.success) {
    await markActivitySynced(activity.id, result.result);
    return { remoteId: result.result };
  }
  if (result.error) return { error: result.error };
  return null;
}

export async function directPushFollowUp(
  followUp: FollowUp,
): Promise<DirectPushResult> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    return adapter.pushFollowUp(token, followUp);
  });

  if (result.success) {
    await markFollowUpSynced(followUp.id, result.result);
    return { remoteId: result.result };
  }
  if (result.error) return { error: result.error };
  return null;
}

export async function directPushContact(
  contact: Contact,
): Promise<{ remoteId: string } | null> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    return adapter.pushContact(token, contact);
  });

  if (result.success) {
    await markContactSynced(contact.id, result.result);
    return { remoteId: result.result };
  }
  return null;
}

export async function directDeleteContact(
  remoteId: string,
): Promise<boolean> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    await adapter.deleteContact(token, remoteId);
  });

  if (!result.success) {
    await insertPendingDelete('contact', remoteId);
  }
  return result.success;
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

export async function resolveOpportunityOptionValues(opportunity: Opportunity): Promise<OpportunityOptionValues> {
  const opt = (attr: string, label: string | null | undefined) =>
    label ? queryOptionSetValue('opportunity', attr, label) : Promise.resolve(null);
  const [stage, sellType, opportunityType, recordType, source,
    singleOrCrossSell, awsPartnerType, awsServiceType, apnTagging, endUserType,
    supportType, migrationType, publicSectorSegment] = await Promise.all([
    opt('im360_oppstage', opportunity.stage),
    opt('im360_opptype', opportunity.sellType),
    opt('im360_drpboxopptype', opportunity.opportunityType),
    opt('im360_recordtype', opportunity.recordType),
    opt('im360_source', opportunity.source),
    opt('im360_singleorcrosssell', opportunity.singleOrCrossSell),
    opt('im360_awspartnertype1', opportunity.awsPartnerType),
    opt('im360_awsservicetype', opportunity.awsServiceType),
    opt('im360_apntagging', opportunity.apnTagging),
    opt('im360_endusertype', opportunity.endUserType),
    opt('im360_supporttype', opportunity.supportType),
    opt('im360_migrationtype', opportunity.migrationType),
    opt('im360_publicsectorsegment', opportunity.publicSectorSegment),
  ]);
  return {
    stage, sellType, opportunityType, recordType, source,
    singleOrCrossSell, awsPartnerType, awsServiceType, apnTagging, endUserType,
    supportType, migrationType, publicSectorSegment,
  };
}

export async function resolveOpportunityLookupValues(opportunity: Opportunity): Promise<OpportunityLookupValues> {
  const lookup = (key: 'opportunity.primaryvendor' | 'opportunity.servicename' | 'opportunity.country' | 'opportunity.currency', label: string | null | undefined) =>
    label ? queryLookupTableId(key, label) : Promise.resolve(null);
  const [primaryVendorId, serviceNameId, countryId, currencyId] = await Promise.all([
    lookup('opportunity.primaryvendor', opportunity.primaryVendor),
    lookup('opportunity.servicename', opportunity.serviceName),
    lookup('opportunity.country', opportunity.country),
    lookup('opportunity.currency', opportunity.currency),
  ]);
  return { primaryVendorId, serviceNameId, countryId, currencyId };
}

export async function directPushOpportunity(
  opportunity: Opportunity,
): Promise<DirectPushResult> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    const [optionValues, lookupValues, contactInfo] = await Promise.all([
      resolveOpportunityOptionValues(opportunity),
      resolveOpportunityLookupValues(opportunity),
      opportunity.contactId ? queryContactPushInfo(opportunity.contactId) : Promise.resolve(null),
    ]);
    return adapter.pushOpportunity(token, opportunity, optionValues, lookupValues, contactInfo?.remoteId ?? null);
  });

  if (result.success) {
    await markOpportunitySynced(opportunity.id, result.result);
    return { remoteId: result.result };
  }
  if (result.error) return { error: result.error };
  return null;
}

export async function directDeleteOpportunity(remoteId: string): Promise<boolean> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    await adapter.deleteOpportunity(token, remoteId);
  });
  return result.success;
}

export async function directPushPrimaryContact(
  accountId: string,
  contactRemoteId: string,
): Promise<boolean> {
  const result = await tryDirectPush(async (token) => {
    const adapter = getD365Adapter();
    await adapter.setPrimaryContact(token, accountId, contactRemoteId);
  });
  return result.success;
}
