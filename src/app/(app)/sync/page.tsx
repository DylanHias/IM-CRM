'use client';

import { useEffect, useState } from 'react';
import { SyncPanel } from '@/components/sync/SyncPanel';
import { useSyncStore } from '@/store/syncStore';
import { queryRecentSyncRecords } from '@/lib/db/queries/sync';
import { queryPendingActivitiesForSync, type PendingActivitySyncItem } from '@/lib/db/queries/activities';
import { queryPendingFollowUpsForSync, type PendingFollowUpSyncItem } from '@/lib/db/queries/followups';
import { queryPendingOpportunitiesForSync, type PendingOpportunitySyncItem } from '@/lib/db/queries/opportunities';
import { isTauriApp } from '@/lib/utils/offlineUtils';

export default function SyncPage() {
  const { recentRecords, setRecentRecords, isSyncing } = useSyncStore();
  const [pendingActivities, setPendingActivities] = useState<PendingActivitySyncItem[]>([]);
  const [pendingFollowUps, setPendingFollowUps] = useState<PendingFollowUpSyncItem[]>([]);
  const [pendingOpportunities, setPendingOpportunities] = useState<PendingOpportunitySyncItem[]>([]);

  useEffect(() => {
    if (!isTauriApp()) return;
    const load = async () => {
      const [records, activities, followUps, opportunities] = await Promise.all([
        queryRecentSyncRecords(200),
        queryPendingActivitiesForSync(),
        queryPendingFollowUpsForSync(),
        queryPendingOpportunitiesForSync(),
      ]);
      setRecentRecords(records);
      setPendingActivities(activities);
      setPendingFollowUps(followUps);
      setPendingOpportunities(opportunities);
    };
    load();
  }, [setRecentRecords, isSyncing]);

  return (
    <div className="mx-auto max-w-[1280px]">
      <SyncPanel
        records={recentRecords}
        pendingActivities={pendingActivities}
        pendingFollowUps={pendingFollowUps}
        pendingOpportunities={pendingOpportunities}
      />
    </div>
  );
}
