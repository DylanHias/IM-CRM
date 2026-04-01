import { getD365Adapter } from './d365Adapter';
import { upsertCustomerBulk } from '@/lib/db/queries/customers';
import { upsertContactBulk } from '@/lib/db/queries/contacts';
import { queryPendingActivities, markActivitySynced, markActivitySyncError } from '@/lib/db/queries/activities';
import { queryPendingFollowUps, markFollowUpSynced } from '@/lib/db/queries/followups';
import { upsertOptionSet } from '@/lib/db/queries/optionSets';
import { insertSyncRecord, updateSyncRecord, getAppSetting, setAppSetting, queryRecentSyncRecords } from '@/lib/db/queries/sync';
import { useSyncStore } from '@/store/syncStore';
import { useOptionSetStore } from '@/store/optionSetStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { v4 as uuidv4 } from 'uuid';

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
    const adapter = getD365Adapter();

    // Delta sync: only fetch records modified since last sync
    const lastSync = await getAppSetting('last_d365_sync');
    const lastSyncTs = lastSync && lastSync.length > 0 ? lastSync : undefined;
    console.log(`[sync] D365 delta sync — last sync: ${lastSyncTs ?? 'never'}`);

    const customers = await adapter.fetchCustomers(token, lastSyncTs);
    console.log(`[sync] Fetched ${customers.length} customers from D365, upserting...`);
    for (const customer of customers) {
      try {
        await upsertCustomerBulk(customer);
        pulled++;
      } catch (err) {
        errors++;
        console.error(`[sync] Failed to upsert customer ${customer.name} (${customer.id}):`, err instanceof Error ? err.message : err);
      }
    }
    if (errors > 0) console.warn(`[sync] ${errors} customer upsert errors out of ${customers.length}`);

    const contacts = await adapter.fetchContacts(token, lastSyncTs);
    console.log(`[sync] Fetched ${contacts.length} contacts from D365, upserting...`);
    let contactErrors = 0;
    for (const contact of contacts) {
      try {
        await upsertContactBulk(contact);
        pulled++;
      } catch (err) {
        contactErrors++;
        console.error(`[sync] Failed to upsert contact ${contact.firstName} ${contact.lastName} (${contact.id}):`, err instanceof Error ? err.message : err);
      }
    }
    if (contactErrors > 0) console.warn(`[sync] ${contactErrors} contact upsert errors out of ${contacts.length}`);
    errors += contactErrors;

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
