import { getD365Adapter } from './d365Adapter';
import { upsertCustomerBulk } from '@/lib/db/queries/customers';
import { upsertContactBulk } from '@/lib/db/queries/contacts';
import { queryPendingActivities, markActivitySynced, markActivitySyncError } from '@/lib/db/queries/activities';
import { queryPendingFollowUps, markFollowUpSynced } from '@/lib/db/queries/followups';
import { upsertOptionSet } from '@/lib/db/queries/optionSets';
import { insertSyncRecord, updateSyncRecord, getAppSetting, setAppSetting, queryRecentSyncRecords } from '@/lib/db/queries/sync';
import { useSyncStore } from '@/store/syncStore';
import { useOptionSetStore } from '@/store/optionSetStore';
import { withTransaction, withBatchedTransactions } from '@/lib/db/client';
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

  try {
    await syncOptionSets(token);
    await syncD365(token);
    await pushPendingActivities(token);
    await pushPendingFollowUps(token);

    const records = await queryRecentSyncRecords(20);
    store.setRecentRecords(records);
  } finally {
    store.setSyncing(false);
  }
}

async function syncD365(token: string): Promise<void> {
  const store = useSyncStore.getState();
  const startedAt = new Date().toISOString();
  const recordId = await insertSyncRecord('d365', 'running', startedAt);
  let pulled = 0;

  try {
    const adapter = getD365Adapter();

    // Delta sync: only fetch records modified since last sync
    const lastSync = await getAppSetting('last_d365_sync');
    const lastSyncTs = lastSync && lastSync.length > 0 ? lastSync : undefined;

    const customers = await adapter.fetchCustomers(token, lastSyncTs);
    await withBatchedTransactions(customers, async (customer) => {
      await upsertCustomerBulk(customer);
      pulled++;
    });

    const contacts = await adapter.fetchContacts(token, lastSyncTs);
    await withBatchedTransactions(contacts, async (contact) => {
      await upsertContactBulk(contact);
      pulled++;
    });

    await updateSyncRecord(recordId, 'success', pulled, 0, null);
    const now = new Date().toISOString();
    await setAppSetting('last_d365_sync', now);
    store.setLastD365Sync(now);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'D365 sync failed';
    await updateSyncRecord(recordId, 'error', pulled, 0, message);
    store.addSyncError({ id: uuidv4(), syncType: 'd365', message, occurredAt: new Date().toISOString() });
    console.error('[sync] D365 error:', err);
  }
}

async function pushPendingActivities(token: string): Promise<void> {
  const store = useSyncStore.getState();
  const pending = await queryPendingActivities();
  if (pending.length === 0) return;

  const startedAt = new Date().toISOString();
  const recordId = await insertSyncRecord('push_activities', 'running', startedAt);
  let pushed = 0;

  const adapter = getD365Adapter();
  for (const activity of pending) {
    try {
      const remoteId = await adapter.pushActivity(token, activity);
      await markActivitySynced(activity.id, remoteId);
      pushed++;
    } catch {
      await markActivitySyncError(activity.id);
      store.addSyncError({
        id: uuidv4(),
        syncType: 'push_activities',
        message: `Failed to push activity: ${activity.subject}`,
        occurredAt: new Date().toISOString(),
      });
    }
  }

  await updateSyncRecord(recordId, pushed === pending.length ? 'success' : 'partial', 0, pushed, null);
  store.setPendingCounts(pending.length - pushed, store.pendingFollowUpCount);
}

async function pushPendingFollowUps(token: string): Promise<void> {
  const store = useSyncStore.getState();
  const pending = await queryPendingFollowUps();
  if (pending.length === 0) return;

  const startedAt = new Date().toISOString();
  const recordId = await insertSyncRecord('push_followups', 'running', startedAt);
  let pushed = 0;

  const adapter = getD365Adapter();
  for (const followUp of pending) {
    try {
      const remoteId = await adapter.pushFollowUp(token, followUp);
      await markFollowUpSynced(followUp.id, remoteId);
      pushed++;
    } catch {
      store.addSyncError({
        id: uuidv4(),
        syncType: 'push_followups',
        message: `Failed to push follow-up: ${followUp.title}`,
        occurredAt: new Date().toISOString(),
      });
    }
  }

  await updateSyncRecord(recordId, pushed === pending.length ? 'success' : 'partial', 0, pushed, null);
  store.setPendingCounts(store.pendingActivityCount, pending.length - pushed);
}

async function syncOptionSets(token: string): Promise<void> {
  try {
    const adapter = getD365Adapter();
    const optionSets = await adapter.fetchOptionSets(token);
    const now = new Date().toISOString();

    await withTransaction(async () => {
      for (const os of optionSets) {
        await upsertOptionSet(os.entityName, os.attributeName, os.options, now);
      }
    });

    await useOptionSetStore.getState().hydrateFromDb();
  } catch (err) {
    console.error('[sync] Option set sync error:', err);
  }
}
