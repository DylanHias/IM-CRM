import { getD365Adapter } from './d365Adapter';
import { fetchD365TeamUserIds } from './d365UserAdapter';
import { upsertCustomerBulk, recomputeLastActivityDates, recomputeCloudCustomerStatus, queryAllCustomerIds } from '@/lib/db/queries/customers';
import { upsertContactBulk, queryContactPhone, queryPendingContacts, markContactSynced, markContactSyncError } from '@/lib/db/queries/contacts';
import { queryPendingActivities, markActivitySynced, markActivitySyncError, upsertPulledActivity } from '@/lib/db/queries/activities';
import { queryPendingFollowUps, markFollowUpSynced, upsertPulledFollowUp } from '@/lib/db/queries/followups';
import {
  queryPendingOpportunities,
  markOpportunitySynced,
  markOpportunitySyncError,
  upsertPulledOpportunity,
} from '@/lib/db/queries/opportunities';
import { queryOptionSetValue } from '@/lib/db/queries/optionSets';
import { queryPendingDeletes, removePendingDelete } from '@/lib/db/queries/pendingDeletes';
import { upsertOptionSet } from '@/lib/db/queries/optionSets';
import { insertSyncRecord, updateSyncRecord, getAppSetting, setAppSetting, queryRecentSyncRecords } from '@/lib/db/queries/sync';
import { useSyncStore } from '@/store/syncStore';
import { useOptionSetStore } from '@/store/optionSetStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { v4 as uuidv4 } from 'uuid';
import type { Opportunity } from '@/types/entities';
import type { OpportunityOptionValues } from '@/lib/sync/d365Adapter';

interface BatchResult {
  successes: number;
  errors: number;
}

/**
 * Process items sequentially with individual auto-committed writes.
 * Manual BEGIN/COMMIT is intentionally avoided — the Tauri SQL plugin uses
 * a sqlx connection pool, so consecutive execute() calls can land on different
 * connections. A BEGIN on connection A followed by an INSERT on connection B
 * causes "database is locked" because A still holds an open transaction.
 * Auto-commit per statement avoids this entirely.
 */
async function batchedUpsert<T>(
  items: T[],
  fn: (item: T) => Promise<boolean>,
  onSuccess: () => void,
  onError: (item: T, err: unknown) => void,
): Promise<BatchResult> {
  let successes = 0;
  let errors = 0;

  for (const item of items) {
    try {
      const result = await fn(item);
      if (result) successes++;
      onSuccess();
    } catch (err) {
      errors++;
      onError(item, err);
    }
  }

  return { successes, errors };
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

  const store = useSyncStore.getState();
  store.setSyncing(true);
  store.clearSyncErrors();
  console.log('[sync] Pushing pending changes');

  try {
    await pushPendingContacts(token);
    await pushPendingActivities(token);
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
  }
}

export async function runFullSync(token: string): Promise<void> {
  if (!isTauriApp()) {
    console.warn('[sync] Not in Tauri — skipping sync');
    return;
  }

  const store = useSyncStore.getState();
  store.setSyncing(true);
  store.clearSyncErrors();
  console.log('[sync] Starting full sync');

  try {
    await syncOptionSets(token);
    await syncD365(token);
    await pushPendingContacts(token);
    await pushPendingActivities(token);
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
    let processed = 0;
    let total = 0;

    const emitProgress = (phase: string) => {
      if (!isInitialSync) return;
      useSyncStore.getState().setInitialSyncProgress({ phase, processed, total });
    };

    const adapter = getD365Adapter();

    // Delta sync: only fetch records modified since last sync
    const lastSync = await getAppSetting('last_d365_sync');
    const lastSyncTs = lastSync && lastSync.length > 0 ? lastSync : undefined;
    console.log(`[sync] D365 delta sync — last sync: ${lastSyncTs ?? 'never'}`);

    const customers = await adapter.fetchCustomers(token, lastSyncTs);
    total += customers.length;
    emitProgress('Syncing customers...');
    const customerResult = await batchedUpsert(
      customers,
      (customer) => upsertCustomerBulk(customer),
      () => { pulled++; processed++; emitProgress('Syncing customers...'); },
      (customer, err) => console.error(`[sync] Failed to upsert customer ${customer.name} (${customer.id}):`, err instanceof Error ? err.message : err),
    );
    errors += customerResult.errors;
    console.log(`[sync] Customers: ${customers.length} fetched, ${customerResult.successes} changed, ${customers.length - customerResult.successes - customerResult.errors} unchanged, ${customerResult.errors} errors`);

    // Build set of local customer IDs so child entities are scoped to Benelux customers only
    const localCustomerIds = await queryAllCustomerIds();
    console.log(`[sync] ${localCustomerIds.size} local customers — filtering child entities to this scope`);

    const contacts = await adapter.fetchContacts(token, localCustomerIds, lastSyncTs);
    total += contacts.length;
    emitProgress('Syncing contacts...');
    const contactResult = await batchedUpsert(
      contacts,
      (contact) => upsertContactBulk(contact),
      () => { pulled++; processed++; emitProgress('Syncing contacts...'); },
      (contact, err) => console.error(`[sync] Failed to upsert contact ${contact.firstName} ${contact.lastName} (${contact.id}):`, err instanceof Error ? err.message : err),
    );
    console.log(`[sync] Contacts: ${contacts.length} scoped, ${contactResult.successes} changed, ${contactResult.errors} errors`);
    errors += contactResult.errors;

    // Pull activities from D365 (filtered to local customers)
    try {
      console.log('[sync] Fetching phone calls from D365...');
      const phoneCalls = await adapter.fetchPhoneCalls(token, localCustomerIds, lastSyncTs);
      total += phoneCalls.length;
      emitProgress('Syncing calls...');
      const phoneResult = await batchedUpsert(
        phoneCalls,
        (activity) => upsertPulledActivity(activity),
        () => { pulled++; processed++; emitProgress('Syncing calls...'); },
        (activity, err) => console.error(`[sync] Failed to upsert phone call ${activity.remoteId}:`, err instanceof Error ? err.message : err),
      );
      errors += phoneResult.errors;
      console.log(`[sync] Phone calls: ${phoneCalls.length} scoped, ${phoneResult.successes} upserted, ${phoneCalls.length - phoneResult.successes - phoneResult.errors} skipped, ${phoneResult.errors} errors`);
    } catch (err) {
      console.error('[sync] Failed to fetch phone calls:', err instanceof Error ? err.message : err);
    }

    try {
      console.log('[sync] Fetching appointments from D365...');
      const appointments = await adapter.fetchAppointments(token, localCustomerIds, lastSyncTs);
      total += appointments.length;
      emitProgress('Syncing appointments...');
      const appointmentResult = await batchedUpsert(
        appointments,
        (activity) => upsertPulledActivity(activity),
        () => { pulled++; processed++; emitProgress('Syncing appointments...'); },
        (activity, err) => console.error(`[sync] Failed to upsert appointment ${activity.remoteId}:`, err instanceof Error ? err.message : err),
      );
      errors += appointmentResult.errors;
      console.log(`[sync] Appointments: ${appointments.length} scoped, ${appointmentResult.successes} upserted, ${appointments.length - appointmentResult.successes - appointmentResult.errors} skipped, ${appointmentResult.errors} errors`);
    } catch (err) {
      console.error('[sync] Failed to fetch appointments:', err instanceof Error ? err.message : err);
    }

    try {
      console.log('[sync] Fetching annotations from D365...');
      const annotations = await adapter.fetchAnnotations(token, localCustomerIds, lastSyncTs);
      total += annotations.length;
      emitProgress('Syncing notes...');
      const annotationResult = await batchedUpsert(
        annotations,
        (activity) => upsertPulledActivity(activity),
        () => { pulled++; processed++; emitProgress('Syncing notes...'); },
        (activity, err) => console.error(`[sync] Failed to upsert annotation ${activity.remoteId}:`, err instanceof Error ? err.message : err),
      );
      errors += annotationResult.errors;
      console.log(`[sync] Annotations: ${annotations.length} scoped, ${annotationResult.successes} upserted, ${annotations.length - annotationResult.successes - annotationResult.errors} skipped, ${annotationResult.errors} errors`);
    } catch (err) {
      console.error('[sync] Failed to fetch annotations:', err instanceof Error ? err.message : err);
    }

    // Pull tasks (follow-ups) from D365 (filtered to local customers)
    try {
      console.log('[sync] Fetching tasks from D365...');
      const tasks = await adapter.fetchTasks(token, localCustomerIds, lastSyncTs);
      total += tasks.length;
      emitProgress('Syncing tasks...');
      const taskResult = await batchedUpsert(
        tasks,
        (followUp) => upsertPulledFollowUp(followUp),
        () => { pulled++; processed++; emitProgress('Syncing tasks...'); },
        (followUp, err) => console.error(`[sync] Failed to upsert task ${followUp.remoteId}:`, err instanceof Error ? err.message : err),
      );
      errors += taskResult.errors;
      console.log(`[sync] Tasks: ${tasks.length} scoped, ${taskResult.successes} upserted, ${tasks.length - taskResult.successes - taskResult.errors} skipped, ${taskResult.errors} errors`);
    } catch (err) {
      console.error('[sync] Failed to fetch tasks:', err instanceof Error ? err.message : err);
    }

    // Pull opportunities from D365 (filtered to Cloud Users - Belgium team members)
    try {
      console.log('[sync] Fetching opportunities from D365...');
      const teamOwnerIds = await fetchD365TeamUserIds(token);
      console.log(`[sync] Resolved ${teamOwnerIds.size} team owner ids for opportunity scope`);
      const opportunities = await adapter.fetchOpportunities(token, localCustomerIds, teamOwnerIds, lastSyncTs);
      total += opportunities.length;
      emitProgress('Syncing opportunities...');
      const opportunityResult = await batchedUpsert(
        opportunities,
        (opportunity) => upsertPulledOpportunity(opportunity),
        () => { pulled++; processed++; emitProgress('Syncing opportunities...'); },
        (opportunity, err) => console.error(`[sync] Failed to upsert opportunity ${opportunity.remoteId}:`, err instanceof Error ? err.message : err),
      );
      errors += opportunityResult.errors;
      console.log(`[sync] Opportunities: ${opportunities.length} scoped, ${opportunityResult.successes} upserted, ${opportunities.length - opportunityResult.successes - opportunityResult.errors} skipped, ${opportunityResult.errors} errors`);
    } catch (err) {
      console.error('[sync] Failed to fetch opportunities:', err instanceof Error ? err.message : err);
    }

    // Derive cloud customer status from contact types + recompute last activity dates
    emitProgress('Finishing up...');
    await recomputeCloudCustomerStatus();
    await recomputeLastActivityDates();

    await updateSyncRecord(recordId, errors > 0 ? 'partial' : 'success', pulled, 0, errors > 0 ? `${errors} upsert errors` : null);
    const now = new Date().toISOString();
    await setAppSetting('last_d365_sync', now);
    store.setLastD365Sync(now);
    if (errors > 0) {
      console.warn(`[sync] ${errors} records failed to upsert — watermark advanced, failed records retry when modified in D365`);
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

async function pushPendingActivities(token: string): Promise<void> {
  const store = useSyncStore.getState();
  const pending = await queryPendingActivities();
  if (pending.length === 0) return;

  console.log(`[sync] Pushing ${pending.length} pending activities to D365`);
  const startedAt = new Date().toISOString();
  const recordId = await insertSyncRecord('push_activities', 'running', startedAt);
  let pushed = 0;

  const adapter = getD365Adapter();
  let callerD365Id: string | undefined;
  try {
    callerD365Id = await adapter.whoAmI(token);
    console.log(`[sync] Resolved caller D365 systemuserid: ${callerD365Id}`);
  } catch (err) {
    console.error('[sync] Failed to resolve caller D365 ID via WhoAmI — call/meeting/visit activities will fail:', err instanceof Error ? err.message : err);
  }
  for (const activity of pending) {
    try {
      const contactPhone = activity.contactId ? await queryContactPhone(activity.contactId) : null;
      const remoteId = await adapter.pushActivity(token, activity, callerD365Id, contactPhone);
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
  store.setPendingCounts(pending.length - pushed, store.pendingFollowUpCount);
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
  store.setPendingCounts(store.pendingActivityCount, pending.length - pushed);
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
      const optionValues = await resolveOpportunityOptionValues(opportunity);
      const remoteId = await adapter.pushOpportunity(token, opportunity, optionValues);
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
