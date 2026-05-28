import { getD365Adapter } from './d365Adapter';
import { fetchD365TeamUserIds, fetchCloudBeluxSalesUsers, fetchCloudBeluxSalesUserIds, fetchBelgiumTeamUsers } from './d365UserAdapter';
import { replaceCloudBeluxUsers } from '@/lib/db/queries/cloudBeluxUsers';
import { replaceBelgiumTeamUsers } from '@/lib/db/queries/belgiumTeamUsers';
import { fetchArrByBcn } from '@/lib/integrations/powerbi/arrAdapter';
import { PowerBiAccessError } from '@/lib/integrations/powerbi/client';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { powerBiRequest } from '@/lib/auth/msalConfig';
import { useAuthStore } from '@/store/authStore';
import { bulkUpsertCustomers, bulkUpdateCustomerArrByBcn, clearStaleCustomerArr, recomputeLastActivityDates, recomputeCloudCustomerStatus, recomputeCustomerHealthScores, queryAllCustomerIds } from '@/lib/db/queries/customers';
import { bulkUpsertContacts, queryAllContactIds, queryContactPushInfo, queryPendingContacts, markContactSynced, markContactSyncError, preloadContactState } from '@/lib/db/queries/contacts';
import { queryPendingActivities, markActivitySynced, markActivitySyncError, preloadActivityState, bulkUpsertActivities } from '@/lib/db/queries/activities';
import { queryPendingFollowUps, markFollowUpSynced, markFollowUpSyncError, preloadFollowUpState, bulkUpsertFollowUps } from '@/lib/db/queries/followups';
import {
  queryPendingOpportunities,
  markOpportunitySynced,
  markOpportunitySyncError,
  preloadOpportunityState,
  bulkUpsertOpportunities,
} from '@/lib/db/queries/opportunities';
import { queryPendingDeletes, removePendingDelete } from '@/lib/db/queries/pendingDeletes';
import { upsertOptionSet } from '@/lib/db/queries/optionSets';
import { upsertLookupTable } from '@/lib/db/queries/lookupTables';
import { insertSyncRecord, updateSyncRecord, getAppSetting, setAppSetting, queryRecentSyncRecords } from '@/lib/db/queries/sync';
import { useSyncStore } from '@/store/syncStore';
import { useOptionSetStore } from '@/store/optionSetStore';
import { useLookupTableStore } from '@/store/lookupTableStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { v4 as uuidv4 } from 'uuid';
import type { Activity, FollowUp, Opportunity } from '@/types/entities';
import { resolveOpportunityOptionValues, resolveOpportunityLookupValues } from '@/lib/sync/directPushService';

let syncInFlight = false;

export async function resetSyncWatermark(): Promise<void> {
  await setAppSetting('last_d365_sync', '');
  useSyncStore.getState().setLastD365Sync('');
  console.log('[sync] Watermark reset — next sync will fetch all records from D365');
}

export async function pushPendingChanges(token: string): Promise<void> {
  if (!isTauriApp()) {
    console.warn('[sync] Not in Tauri — skipping push');
    return;
  }
  if (syncInFlight) {
    console.warn('[sync] pushPendingChanges skipped — another sync is already running');
    return;
  }
  syncInFlight = true;

  const store = useSyncStore.getState();
  store.setSyncing(true);
  store.clearSyncErrors();
  console.log('[sync] Pushing pending changes');

  try {
    let resolvedCallerD365Id: string | undefined;
    try {
      const adapter = getD365Adapter();
      resolvedCallerD365Id = await adapter.whoAmI(token);
      store.setCallerD365UserId(resolvedCallerD365Id);
      console.log(`[sync] Persisted caller D365 systemuserid: ${resolvedCallerD365Id}`);
    } catch (err) {
      console.error('[sync] Failed to resolve caller D365 ID via WhoAmI:', err instanceof Error ? err.message : err);
    }

    await pushPendingContacts(token);
    await pushPendingActivities(token, resolvedCallerD365Id);
    await pushPendingFollowUps(token);
    await pushPendingOpportunities(token);
    await pushPendingDeletes(token);

    const records = await queryRecentSyncRecords(20);
    store.setRecentRecords(records);
    console.log('[sync] Pending push complete');
  } catch (err) {
    console.error('[sync] Pending push failed:', err instanceof Error ? err.message : err);
    throw err;
  } finally {
    store.setSyncing(false);
    syncInFlight = false;
  }
}

export async function runFullSync(token: string): Promise<void> {
  if (!isTauriApp()) {
    console.warn('[sync] Not in Tauri — skipping sync');
    return;
  }
  if (syncInFlight) {
    console.warn('[sync] runFullSync skipped — another sync is already running');
    return;
  }
  syncInFlight = true;

  const store = useSyncStore.getState();
  store.setSyncing(true);
  store.clearSyncErrors();
  console.log('[sync] Starting full sync');

  try {
    await Promise.all([syncOptionSets(token), syncLookupTables(token), syncCloudBeluxUsers(token), syncBelgiumTeamUsers(token)]);

    // Resolve the caller's D365 system user ID once and persist it so analytics
    // queries can match D365-synced activities (which store the D365 GUID as created_by_id).
    let resolvedCallerD365Id: string | undefined;
    try {
      const adapter = getD365Adapter();
      resolvedCallerD365Id = await adapter.whoAmI(token);
      store.setCallerD365UserId(resolvedCallerD365Id);
      console.log(`[sync] Persisted caller D365 systemuserid: ${resolvedCallerD365Id}`);
    } catch (err) {
      console.error('[sync] Failed to resolve caller D365 ID via WhoAmI:', err instanceof Error ? err.message : err);
    }

    await syncD365(token);
    await syncPowerBiArr();
    await pushPendingContacts(token);
    await pushPendingActivities(token, resolvedCallerD365Id);
    await pushPendingFollowUps(token);
    await pushPendingOpportunities(token);
    await pushPendingDeletes(token);

    const records = await queryRecentSyncRecords(20);
    store.setRecentRecords(records);
    console.log('[sync] Full sync complete');
  } catch (err) {
    console.error('[sync] Full sync failed:', err instanceof Error ? err.message : err);
    throw err;
  } finally {
    store.setSyncing(false);
    syncInFlight = false;
  }
}

async function syncD365(token: string): Promise<void> {
  const store = useSyncStore.getState();
  const startedAt = new Date().toISOString();
  const recordId = await insertSyncRecord('d365', 'running', startedAt);
  let pulled = 0;
  let errors = 0;

  try {
    const isInitialSync = useSyncStore.getState().initialSyncProgress !== null;
    const emitProgress = (phase: string, processed: number, total: number) => {
      if (!isInitialSync) return;
      useSyncStore.getState().setInitialSyncProgress({ phase, processed, total });
    };

    const adapter = getD365Adapter();
    const lastSync = await getAppSetting('last_d365_sync');
    const lastSyncTs = lastSync && lastSync.length > 0 ? lastSync : undefined;
    console.log(`[sync] D365 sync — last sync: ${lastSyncTs ?? 'never (initial)'}`);

    // --- Customers ---
    emitProgress('Fetching customers...', 0, 0);
    console.time('[sync] fetch:customers');
    const customers = await adapter.fetchCustomers(token, lastSyncTs);
    console.timeEnd('[sync] fetch:customers');
    emitProgress('Syncing customers...', 0, 0);
    console.time('[sync] write:customers');
    const customerChanged = await bulkUpsertCustomers(customers);
    console.timeEnd('[sync] write:customers');
    pulled += customerChanged;
    console.log(`[sync] Customers: ${customers.length} fetched, ${customerChanged} changed`);

    const localCustomerIds = await queryAllCustomerIds();
    console.log(`[sync] ${localCustomerIds.size} local customers — filtering child entities to this scope`);

    // --- Parallel D365 fetch (contacts + all activity types + opportunities) ---
    // Keep total=0 (indeterminate) until we know all record counts after the parallel fetch
    emitProgress('Fetching from Dynamics 365...', 0, 0);
    console.time('[sync] fetch:parallel');
    const [contacts, phoneCalls, appointments, annotations, tasks, opportunities] = await Promise.all([
      adapter.fetchContacts(token, localCustomerIds, lastSyncTs),
      adapter.fetchPhoneCalls(token, localCustomerIds, lastSyncTs).catch((err: unknown) => {
        console.error('[sync] Failed to fetch phone calls:', err instanceof Error ? err.message : err);
        return [] as Activity[];
      }),
      adapter.fetchAppointments(token, localCustomerIds, lastSyncTs).catch((err: unknown) => {
        console.error('[sync] Failed to fetch appointments:', err instanceof Error ? err.message : err);
        return [] as Activity[];
      }),
      adapter.fetchAnnotations(token, localCustomerIds, lastSyncTs).catch((err: unknown) => {
        console.error('[sync] Failed to fetch annotations:', err instanceof Error ? err.message : err);
        return [] as Activity[];
      }),
      adapter.fetchTasks(token, localCustomerIds, lastSyncTs).catch((err: unknown) => {
        console.error('[sync] Failed to fetch tasks:', err instanceof Error ? err.message : err);
        return [] as FollowUp[];
      }),
      Promise.all([fetchD365TeamUserIds(token), fetchCloudBeluxSalesUserIds(token)])
        .then(([cloudUsersBelgium, cloudBeluxSales]) => {
          const teamOwnerIds = new Set<string>();
          cloudUsersBelgium.forEach((id) => teamOwnerIds.add(id));
          cloudBeluxSales.forEach((id) => teamOwnerIds.add(id));
          console.log(`[sync] Resolved ${teamOwnerIds.size} team owner ids for opportunity scope (Cloud Users - Belgium: ${cloudUsersBelgium.size}, Cloud Belux Sales: ${cloudBeluxSales.size})`);
          return adapter.fetchOpportunities(token, localCustomerIds, teamOwnerIds, lastSyncTs);
        })
        .catch((err: unknown) => {
          console.error('[sync] Failed to fetch opportunities:', err instanceof Error ? err.message : err);
          return [] as Opportunity[];
        }),
    ]);
    console.timeEnd('[sync] fetch:parallel');
    console.log(`[sync] Fetched: ${contacts.length} contacts, ${phoneCalls.length} calls, ${appointments.length} appointments, ${annotations.length} annotations, ${tasks.length} tasks, ${opportunities.length} opportunities`);

    const totalFetched = contacts.length + phoneCalls.length + appointments.length + annotations.length + tasks.length + opportunities.length;
    // Now we know the full total — set it once so the bar never goes backwards
    const grandTotal = customers.length + totalFetched;
    let processed = customers.length; // customers already written above

    // --- Contacts ---
    emitProgress('Syncing contacts...', processed, grandTotal);
    console.time('[sync] write:contacts');
    const existingContactMap = await preloadContactState();
    const contactChanged = await bulkUpsertContacts(contacts, localCustomerIds, existingContactMap);
    console.timeEnd('[sync] write:contacts');
    pulled += contactChanged;
    processed += contacts.length;
    console.log(`[sync] Contacts: ${contacts.length} scoped, ${contactChanged} changed`);

    // --- Preload lookup state for activities / follow-ups / opportunities ---
    const [contactIdSet, existingActivityMap, existingFollowUpMap, existingOppMap] = await Promise.all([
      queryAllContactIds(),
      preloadActivityState(),
      preloadFollowUpState(),
      preloadOpportunityState(),
    ]);

    // --- Activities (phone calls + appointments + annotations combined) ---
    emitProgress('Syncing activities...', processed, grandTotal);
    console.time('[sync] write:activities');
    const allActivities = [...phoneCalls, ...appointments, ...annotations];
    const activityResult = await bulkUpsertActivities(allActivities, localCustomerIds, contactIdSet, existingActivityMap);
    console.timeEnd('[sync] write:activities');
    pulled += activityResult.inserted + activityResult.updated;
    errors += activityResult.errors;
    processed += allActivities.length;
    console.log(`[sync] Activities: ${allActivities.length} fetched, ${activityResult.inserted} inserted, ${activityResult.updated} updated, ${activityResult.skipped} skipped, ${activityResult.errors} errors`);

    // --- Follow-ups (tasks) ---
    emitProgress('Syncing tasks...', processed, grandTotal);
    console.time('[sync] write:followups');
    const followUpResult = await bulkUpsertFollowUps(tasks, localCustomerIds, existingFollowUpMap);
    console.timeEnd('[sync] write:followups');
    pulled += followUpResult.inserted + followUpResult.updated;
    errors += followUpResult.errors;
    processed += tasks.length;
    console.log(`[sync] Tasks: ${tasks.length} fetched, ${followUpResult.inserted} inserted, ${followUpResult.updated} updated, ${followUpResult.skipped} skipped, ${followUpResult.errors} errors`);

    // --- Opportunities ---
    emitProgress('Syncing opportunities...', processed, grandTotal);
    console.time('[sync] write:opportunities');
    const opportunityResult = await bulkUpsertOpportunities(opportunities, localCustomerIds, contactIdSet, existingOppMap);
    console.timeEnd('[sync] write:opportunities');
    pulled += opportunityResult.inserted + opportunityResult.updated;
    errors += opportunityResult.errors;
    processed += opportunities.length;
    console.log(`[sync] Opportunities: ${opportunities.length} fetched, ${opportunityResult.inserted} inserted, ${opportunityResult.updated} updated, ${opportunityResult.skipped} skipped, ${opportunityResult.errors} errors`);

    // --- Post-sync derives ---
    emitProgress('Finishing up...', grandTotal, grandTotal);
    await recomputeCloudCustomerStatus();
    await recomputeLastActivityDates();
    await recomputeCustomerHealthScores();

    await updateSyncRecord(recordId, errors > 0 ? 'partial' : 'success', pulled, 0, errors > 0 ? `${errors} errors` : null);
    const now = new Date().toISOString();
    await setAppSetting('last_d365_sync', now);
    store.setLastD365Sync(now);
    if (errors > 0) {
      console.warn(`[sync] ${errors} errors — watermark advanced, failed records retry when modified in D365`);
    }
    console.log(`[sync] D365 sync done — pulled ${pulled}, errors ${errors}, watermark set to ${now}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'D365 sync failed';
    console.error(`[sync] D365 sync error: ${message}`, err);
    try {
      await updateSyncRecord(recordId, 'error', pulled, 0, message);
    } catch (recordErr) {
      console.error('[sync] Failed to update sync record after D365 error:', recordErr instanceof Error ? recordErr.message : recordErr);
    }
    store.addSyncError({ id: uuidv4(), syncType: 'd365', message, occurredAt: new Date().toISOString() });
  }
}

export async function syncPowerBiArr(): Promise<void> {
  const store = useSyncStore.getState();
  if (store.powerBiAccessDenied) {
    console.log('[sync] PowerBI ARR skipped: access previously denied — use Sync page banner to request access');
    return;
  }
  const startedAt = new Date().toISOString();
  const recordId = await insertSyncRecord('powerbi_arr', 'running', startedAt);
  let updated = 0;

  try {
    const token = await getAccessToken(powerBiRequest.scopes);
    if (!token) {
      const consentScopes = useAuthStore.getState().consentRequiredScopes;
      const needsAdminConsent = consentScopes?.some((s) => s.includes('powerbi')) ?? false;
      const message = needsAdminConsent
        ? 'Power BI access requires Azure AD admin approval — ask your IT admin to grant consent for the IM-CRM Desktop app'
        : 'No Power BI access token — sign in again to grant access';
      console.warn(`[sync] PowerBI ARR skipped: ${message}`);
      await updateSyncRecord(recordId, 'error', 0, 0, message);
      return;
    }

    console.time('[sync] fetch:powerbi-arr');
    const entries = await fetchArrByBcn(token);
    console.timeEnd('[sync] fetch:powerbi-arr');
    console.log(`[sync] PowerBI ARR: ${entries.length} rows fetched`);

    if (entries.length === 0) {
      await updateSyncRecord(recordId, 'success', 0, 0, null);
      return;
    }

    updated = await bulkUpdateCustomerArrByBcn(entries);
    const freshBcns = new Set(entries.map((e) => e.bcn));
    const cleared = await clearStaleCustomerArr(freshBcns);

    const now = new Date().toISOString();
    await setAppSetting('last_powerbi_arr_sync', now);
    console.log(`[sync] PowerBI ARR: ${updated} customers updated, ${cleared} cleared`);
    store.setPowerBiAccessDenied(false);
    await updateSyncRecord(recordId, 'success', entries.length, 0, null);

    // Also refresh the insights + ARR movement snapshots so they show up in sync history too.
    await Promise.all([
      import('@/lib/integrations/powerbi/revenueInsightsService')
        .then((m) => m.refreshInsightsFromPowerBi(token))
        .catch((err) => console.error('[sync] PowerBI insights snapshot failed:', err instanceof Error ? err.message : err)),
      import('@/lib/integrations/powerbi/customerRevenueDetailService')
        .then((m) => m.refreshArrMovementFromPowerBi(token))
        .catch((err) => console.error('[sync] PowerBI ARR movement snapshot failed:', err instanceof Error ? err.message : err)),
    ]);
  } catch (err) {
    if (err instanceof PowerBiAccessError) {
      console.warn(`[sync] PowerBI ARR skipped: ${err.message}`);
      store.setPowerBiAccessDenied(true);
      try {
        await updateSyncRecord(recordId, 'error', updated, 0, err.message);
      } catch (recordErr) {
        console.error('[sync] Failed to update sync record after PowerBI access error:', recordErr instanceof Error ? recordErr.message : recordErr);
      }
      store.addSyncError({ id: uuidv4(), syncType: 'powerbi_arr', message: `ARR: ${err.message}`, occurredAt: new Date().toISOString() });
      return;
    }
    const message = err instanceof Error ? err.message : 'PowerBI ARR sync failed';
    console.error(`[sync] PowerBI ARR error: ${message}`, err);
    try {
      await updateSyncRecord(recordId, 'error', updated, 0, message);
    } catch (recordErr) {
      console.error('[sync] Failed to update sync record after PowerBI error:', recordErr instanceof Error ? recordErr.message : recordErr);
    }
    store.addSyncError({ id: uuidv4(), syncType: 'powerbi_arr', message: `ARR: ${message}`, occurredAt: new Date().toISOString() });
  }
}

async function pushPendingContacts(token: string): Promise<void> {
  const pending = await queryPendingContacts();
  if (pending.length === 0) return;

  console.log(`[sync] Pushing ${pending.length} pending contacts to D365`);
  const adapter = getD365Adapter();
  let pushed = 0;

  for (const contact of pending) {
    try {
      const remoteId = await adapter.pushContact(token, contact);
      await markContactSynced(contact.id, remoteId);
      pushed++;
    } catch (err) {
      console.error(`[sync] Failed to push contact "${contact.firstName} ${contact.lastName}" (${contact.id}):`, err instanceof Error ? err.message : err);
      await markContactSyncError(contact.id);
    }
  }

  console.log(`[sync] Pushed ${pushed}/${pending.length} contacts`);
}

async function pushPendingActivities(token: string, callerD365Id?: string): Promise<void> {
  const store = useSyncStore.getState();
  const pending = await queryPendingActivities();
  if (pending.length === 0) return;

  console.log(`[sync] Pushing ${pending.length} pending activities to D365`);
  const startedAt = new Date().toISOString();
  const recordId = await insertSyncRecord('push_activities', 'running', startedAt);
  let pushed = 0;

  const adapter = getD365Adapter();
  if (!callerD365Id) {
    try {
      callerD365Id = await adapter.whoAmI(token);
      store.setCallerD365UserId(callerD365Id);
      console.log(`[sync] Resolved caller D365 systemuserid: ${callerD365Id}`);
    } catch (err) {
      console.error('[sync] Failed to resolve caller D365 ID via WhoAmI — call/meeting/visit activities will fail:', err instanceof Error ? err.message : err);
    }
  }
  for (const activity of pending) {
    try {
      const contactInfo = activity.contactId ? await queryContactPushInfo(activity.contactId) : null;
      const remoteId = await adapter.pushActivity(token, activity, callerD365Id, contactInfo?.phone ?? null, contactInfo?.remoteId ?? null);
      await markActivitySynced(activity.id, remoteId);
      pushed++;
    } catch (err) {
      console.error(`[sync] Failed to push activity "${activity.subject}" (${activity.id}):`, err instanceof Error ? err.message : err);
      await markActivitySyncError(activity.id);
      store.addSyncError({
        id: uuidv4(),
        syncType: 'push_activities',
        message: `Failed to push activity: ${activity.subject}`,
        occurredAt: new Date().toISOString(),
      });
    }
  }

  const activityErrors = pending.length - pushed;
  console.log(`[sync] Pushed ${pushed}/${pending.length} activities`);
  await updateSyncRecord(recordId, pushed === pending.length ? 'success' : 'partial', 0, pushed, activityErrors > 0 ? `${activityErrors} push errors` : null);
  store.setPendingCounts(pending.length - pushed, store.pendingFollowUpCount, store.pendingOpportunityCount);
}

async function pushPendingFollowUps(token: string): Promise<void> {
  const store = useSyncStore.getState();
  const pending = await queryPendingFollowUps();
  if (pending.length === 0) return;

  console.log(`[sync] Pushing ${pending.length} pending follow-ups to D365`);
  const startedAt = new Date().toISOString();
  const recordId = await insertSyncRecord('push_followups', 'running', startedAt);
  let pushed = 0;

  const adapter = getD365Adapter();
  for (const followUp of pending) {
    try {
      const remoteId = await adapter.pushFollowUp(token, followUp);
      await markFollowUpSynced(followUp.id, remoteId);
      pushed++;
    } catch (err) {
      console.error(`[sync] Failed to push follow-up "${followUp.title}" (${followUp.id}):`, err instanceof Error ? err.message : err);
      await markFollowUpSyncError(followUp.id);
      store.addSyncError({
        id: uuidv4(),
        syncType: 'push_followups',
        message: `Failed to push follow-up: ${followUp.title}`,
        occurredAt: new Date().toISOString(),
      });
    }
  }

  const followUpErrors = pending.length - pushed;
  console.log(`[sync] Pushed ${pushed}/${pending.length} follow-ups`);
  await updateSyncRecord(recordId, pushed === pending.length ? 'success' : 'partial', 0, pushed, followUpErrors > 0 ? `${followUpErrors} push errors` : null);
  store.setPendingCounts(store.pendingActivityCount, pending.length - pushed, store.pendingOpportunityCount);
}

async function pushPendingOpportunities(token: string): Promise<void> {
  const store = useSyncStore.getState();
  const pending = await queryPendingOpportunities();
  if (pending.length === 0) return;

  console.log(`[sync] Pushing ${pending.length} pending opportunities to D365`);
  const startedAt = new Date().toISOString();
  const recordId = await insertSyncRecord('push_opportunities', 'running', startedAt);
  let pushed = 0;

  const adapter = getD365Adapter();
  for (const opportunity of pending) {
    try {
      const [optionValues, lookupValues, contactInfo] = await Promise.all([
        resolveOpportunityOptionValues(opportunity),
        resolveOpportunityLookupValues(opportunity),
        opportunity.contactId ? queryContactPushInfo(opportunity.contactId) : Promise.resolve(null),
      ]);
      const remoteId = await adapter.pushOpportunity(token, opportunity, optionValues, lookupValues, contactInfo?.remoteId ?? null);
      await markOpportunitySynced(opportunity.id, remoteId);
      pushed++;
    } catch (err) {
      console.error(`[sync] Failed to push opportunity "${opportunity.subject}" (${opportunity.id}):`, err instanceof Error ? err.message : err);
      await markOpportunitySyncError(opportunity.id);
      store.addSyncError({
        id: uuidv4(),
        syncType: 'push_opportunities',
        message: `Failed to push opportunity: ${opportunity.subject}`,
        occurredAt: new Date().toISOString(),
      });
    }
  }

  const errors = pending.length - pushed;
  console.log(`[sync] Pushed ${pushed}/${pending.length} opportunities`);
  await updateSyncRecord(recordId, pushed === pending.length ? 'success' : 'partial', 0, pushed, errors > 0 ? `${errors} push errors` : null);
  store.setPendingCounts(store.pendingActivityCount, store.pendingFollowUpCount, pending.length - pushed);
}

async function pushPendingDeletes(token: string): Promise<void> {
  const pending = await queryPendingDeletes();
  if (pending.length === 0) return;

  console.log(`[sync] Pushing ${pending.length} pending deletes to D365`);
  let deleted = 0;
  const adapter = getD365Adapter();

  for (const item of pending) {
    try {
      if (item.entityType === 'opportunity') {
        await adapter.deleteOpportunity(token, item.remoteId);
      } else if (item.entityType === 'task') {
        await adapter.deleteFollowUp(token, item.remoteId);
      } else if (item.entityType === 'contact') {
        await adapter.deleteContact(token, item.remoteId);
      } else {
        const activityType = item.entityType === 'phonecall' ? 'call' : item.entityType === 'annotation' ? 'note' : 'meeting';
        await adapter.deleteActivity(token, item.remoteId, activityType);
      }
      await removePendingDelete(item.id);
      deleted++;
    } catch (err) {
      console.error(`[sync] Failed to delete ${item.entityType} ${item.remoteId} from D365:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`[sync] Deleted ${deleted}/${pending.length} records from D365`);
}

async function syncOptionSets(token: string): Promise<void> {
  try {
    const adapter = getD365Adapter();
    const optionSets = await adapter.fetchOptionSets(token);
    const now = new Date().toISOString();
    console.log(`[sync] Syncing ${optionSets.length} option sets`);

    for (const os of optionSets) {
      try {
        await upsertOptionSet(os.entityName, os.attributeName, os.options, now);
      } catch (err) {
        console.error(`[sync] Failed to upsert option set ${os.entityName}.${os.attributeName}:`, err instanceof Error ? err.message : err);
      }
    }

    await useOptionSetStore.getState().hydrateFromDb();
    console.log('[sync] Option sets synced');
  } catch (err) {
    console.error('[sync] Option set sync error:', err instanceof Error ? err.message : err);
  }
}

async function syncCloudBeluxUsers(token: string): Promise<void> {
  try {
    const users = await fetchCloudBeluxSalesUsers(token);
    await replaceCloudBeluxUsers(users);
    console.log(`[sync] Cloud Belux Sales team: ${users.length} users synced`);
  } catch (err) {
    console.error('[sync] Cloud Belux Sales team sync error:', err instanceof Error ? err.message : err);
  }
}

async function syncBelgiumTeamUsers(token: string): Promise<void> {
  try {
    const users = await fetchBelgiumTeamUsers(token);
    await replaceBelgiumTeamUsers(users);
    console.log(`[sync] Belgium team: ${users.length} users synced`);
  } catch (err) {
    console.error('[sync] Belgium team sync error:', err instanceof Error ? err.message : err);
  }
}

export async function syncLookupTables(token: string): Promise<void> {
  try {
    const adapter = getD365Adapter();
    const tables = await adapter.fetchLookupTables(token);
    const now = new Date().toISOString();
    let total = 0;

    for (const table of tables) {
      try {
        await upsertLookupTable(table.key, table.items, now);
        total += table.items.length;
      } catch (err) {
        console.error(`[sync] Failed to upsert lookup table ${table.key}:`, err instanceof Error ? err.message : err);
      }
    }

    await useLookupTableStore.getState().hydrateFromDb();
    console.log(`[sync] Lookup tables synced (${total} records across ${tables.length} tables)`);
  } catch (err) {
    console.error('[sync] Lookup table sync error:', err instanceof Error ? err.message : err);
  }
}
