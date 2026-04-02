import { getD365Adapter } from './d365Adapter';
import { upsertCustomerBulk, recomputeLastActivityDates, queryAllCustomerIds } from '@/lib/db/queries/customers';
import { upsertContactBulk } from '@/lib/db/queries/contacts';
import { queryPendingActivities, markActivitySynced, markActivitySyncError, upsertPulledActivity } from '@/lib/db/queries/activities';
import { queryPendingFollowUps, markFollowUpSynced, upsertPulledFollowUp } from '@/lib/db/queries/followups';
import { queryPendingDeletes, removePendingDelete } from '@/lib/db/queries/pendingDeletes';
import { upsertOptionSet } from '@/lib/db/queries/optionSets';
import { insertSyncRecord, updateSyncRecord, getAppSetting, setAppSetting, queryRecentSyncRecords } from '@/lib/db/queries/sync';
import { useSyncStore } from '@/store/syncStore';
import { useOptionSetStore } from '@/store/optionSetStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { v4 as uuidv4 } from 'uuid';

export async function resetSyncWatermark(): Promise<void> {
  await setAppSetting('last_d365_sync', '');
  useSyncStore.getState().setLastD365Sync('');
  console.log('[sync] Watermark reset — next sync will fetch all records from D365');
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
    await pushPendingActivities(token);
    await pushPendingFollowUps(token);
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
    let customersChanged = 0;
    for (const customer of customers) {
      try {
        const changed = await upsertCustomerBulk(customer);
        if (changed) customersChanged++;
        pulled++;
        processed++;
        emitProgress('Syncing customers...');
      } catch (err) {
        errors++;
        console.error(`[sync] Failed to upsert customer ${customer.name} (${customer.id}):`, err instanceof Error ? err.message : err);
      }
    }
    console.log(`[sync] Customers: ${customers.length} fetched, ${customersChanged} changed, ${customers.length - customersChanged - errors} unchanged, ${errors} errors`);

    // Build set of local customer IDs so child entities are scoped to Benelux customers only
    const localCustomerIds = await queryAllCustomerIds();
    console.log(`[sync] ${localCustomerIds.size} local customers — filtering child entities to this scope`);

    const contacts = await adapter.fetchContacts(token, localCustomerIds, lastSyncTs);
    total += contacts.length;
    emitProgress('Syncing contacts...');
    let contactsChanged = 0;
    let contactErrors = 0;
    for (const contact of contacts) {
      try {
        const changed = await upsertContactBulk(contact);
        if (changed) contactsChanged++;
        pulled++;
        processed++;
        emitProgress('Syncing contacts...');
      } catch (err) {
        contactErrors++;
        console.error(`[sync] Failed to upsert contact ${contact.firstName} ${contact.lastName} (${contact.id}):`, err instanceof Error ? err.message : err);
      }
    }
    console.log(`[sync] Contacts: ${contacts.length} scoped, ${contactsChanged} changed, ${contactErrors} errors`);
    errors += contactErrors;

    // Pull activities from D365 (filtered to local customers)
    try {
      console.log('[sync] Fetching phone calls from D365...');
      const phoneCalls = await adapter.fetchPhoneCalls(token, localCustomerIds, lastSyncTs);
      total += phoneCalls.length;
      emitProgress('Syncing calls...');
      let phoneCallsUpserted = 0;
      let phoneCallsSkipped = 0;
      for (const activity of phoneCalls) {
        try {
          const upserted = await upsertPulledActivity(activity);
          if (upserted) { phoneCallsUpserted++; pulled++; processed++; emitProgress('Syncing calls...'); } else { phoneCallsSkipped++; }
        } catch (err) {
          errors++;
          console.error(`[sync] Failed to upsert phone call ${activity.remoteId}:`, err instanceof Error ? err.message : err);
        }
      }
      console.log(`[sync] Phone calls: ${phoneCalls.length} scoped, ${phoneCallsUpserted} upserted, ${phoneCallsSkipped} skipped`);
    } catch (err) {
      console.error('[sync] Failed to fetch phone calls:', err instanceof Error ? err.message : err);
    }

    try {
      console.log('[sync] Fetching appointments from D365...');
      const appointments = await adapter.fetchAppointments(token, localCustomerIds, lastSyncTs);
      total += appointments.length;
      emitProgress('Syncing appointments...');
      let appointmentsUpserted = 0;
      let appointmentsSkipped = 0;
      for (const activity of appointments) {
        try {
          const upserted = await upsertPulledActivity(activity);
          if (upserted) { appointmentsUpserted++; pulled++; processed++; emitProgress('Syncing appointments...'); } else { appointmentsSkipped++; }
        } catch (err) {
          errors++;
          console.error(`[sync] Failed to upsert appointment ${activity.remoteId}:`, err instanceof Error ? err.message : err);
        }
      }
      console.log(`[sync] Appointments: ${appointments.length} scoped, ${appointmentsUpserted} upserted, ${appointmentsSkipped} skipped`);
    } catch (err) {
      console.error('[sync] Failed to fetch appointments:', err instanceof Error ? err.message : err);
    }

    try {
      console.log('[sync] Fetching annotations from D365...');
      const annotations = await adapter.fetchAnnotations(token, localCustomerIds, lastSyncTs);
      total += annotations.length;
      emitProgress('Syncing notes...');
      let annotationsUpserted = 0;
      let annotationsSkipped = 0;
      for (const activity of annotations) {
        try {
          const upserted = await upsertPulledActivity(activity);
          if (upserted) { annotationsUpserted++; pulled++; processed++; emitProgress('Syncing notes...'); } else { annotationsSkipped++; }
        } catch (err) {
          errors++;
          console.error(`[sync] Failed to upsert annotation ${activity.remoteId}:`, err instanceof Error ? err.message : err);
        }
      }
      console.log(`[sync] Annotations: ${annotations.length} scoped, ${annotationsUpserted} upserted, ${annotationsSkipped} skipped`);
    } catch (err) {
      console.error('[sync] Failed to fetch annotations:', err instanceof Error ? err.message : err);
    }

    // Pull tasks (follow-ups) from D365 (filtered to local customers)
    try {
      console.log('[sync] Fetching tasks from D365...');
      const tasks = await adapter.fetchTasks(token, localCustomerIds, lastSyncTs);
      total += tasks.length;
      emitProgress('Syncing tasks...');
      let tasksUpserted = 0;
      let tasksSkipped = 0;
      for (const followUp of tasks) {
        try {
          const upserted = await upsertPulledFollowUp(followUp);
          if (upserted) { tasksUpserted++; pulled++; processed++; emitProgress('Syncing tasks...'); } else { tasksSkipped++; }
        } catch (err) {
          errors++;
          console.error(`[sync] Failed to upsert task ${followUp.remoteId}:`, err instanceof Error ? err.message : err);
        }
      }
      console.log(`[sync] Tasks: ${tasks.length} scoped, ${tasksUpserted} upserted, ${tasksSkipped} skipped`);
    } catch (err) {
      console.error('[sync] Failed to fetch tasks:', err instanceof Error ? err.message : err);
    }

    // Recompute last activity dates from actual activities + contact changes
    emitProgress('Finishing up...');
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

async function pushPendingActivities(token: string): Promise<void> {
  const store = useSyncStore.getState();
  const pending = await queryPendingActivities();
  if (pending.length === 0) return;

  console.log(`[sync] Pushing ${pending.length} pending activities to D365`);
  const startedAt = new Date().toISOString();
  const recordId = await insertSyncRecord('push_activities', 'running', startedAt);
  let pushed = 0;

  const adapter = getD365Adapter();
  for (const activity of pending) {
    try {
      const remoteId = await adapter.pushActivity(token, activity);
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

  console.log(`[sync] Pushed ${pushed}/${pending.length} activities`);
  await updateSyncRecord(recordId, pushed === pending.length ? 'success' : 'partial', 0, pushed, null);
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

  console.log(`[sync] Pushed ${pushed}/${pending.length} follow-ups`);
  await updateSyncRecord(recordId, pushed === pending.length ? 'success' : 'partial', 0, pushed, null);
  store.setPendingCounts(store.pendingActivityCount, pending.length - pushed);
}

async function pushPendingDeletes(token: string): Promise<void> {
  const pending = await queryPendingDeletes();
  if (pending.length === 0) return;

  console.log(`[sync] Pushing ${pending.length} pending deletes to D365`);
  let deleted = 0;
  const adapter = getD365Adapter();

  for (const item of pending) {
    try {
      if (item.entityType === 'task') {
        await adapter.deleteFollowUp(token, item.remoteId);
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
