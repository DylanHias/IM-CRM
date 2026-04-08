'use client';

import { useEffect, useState } from 'react';
import { SyncPanel } from '@/components/sync/SyncPanel';
import { useSyncStore } from '@/store/syncStore';
import { queryRecentSyncRecords } from '@/lib/db/queries/sync';
import { queryPendingActivitiesForSync, type PendingActivitySyncItem } from '@/lib/db/queries/activities';
import { queryPendingFollowUpsForSync, type PendingFollowUpSyncItem } from '@/lib/db/queries/followups';
import { isTauriApp } from '@/lib/utils/offlineUtils';

export default function SyncPage() {
  const { recentRecords, setRecentRecords, isSyncing } = useSyncStore();
  const [pendingActivities, setPendingActivities] = useState<PendingActivitySyncItem[]>([]);
  const [pendingFollowUps, setPendingFollowUps] = useState<PendingFollowUpSyncItem[]>([]);

  useEffect(() => {
    if (!isTauriApp()) return;
    const load = async () => {
      const [records, activities, followUps] = await Promise.all([
        queryRecentSyncRecords(200),
        queryPendingActivitiesForSync(),
        queryPendingFollowUpsForSync(),
      ]);
      setRecentRecords(records);
      setPendingActivities(activities);
      setPendingFollowUps(followUps);
    };
    load();
  }, [setRecentRecords, isSyncing]);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Sync</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sync customer data from Dynamics 365 and push local changes.
        </p>
      </div>
      <SyncPanel
        records={recentRecords}
        pendingActivities={pendingActivities}
        pendingFollowUps={pendingFollowUps}
      />
    </div>
  );
}
