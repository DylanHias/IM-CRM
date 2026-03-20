'use client';

import { useEffect } from 'react';
import { SyncPanel } from '@/components/sync/SyncPanel';
import { useSyncStore } from '@/store/syncStore';
import { queryRecentSyncRecords } from '@/lib/db/queries/sync';
import { isTauriApp } from '@/lib/utils/offlineUtils';

export default function SyncPage() {
  const { recentRecords, setRecentRecords } = useSyncStore();

  useEffect(() => {
    if (!isTauriApp()) return;
    const load = async () => {
      const records = await queryRecentSyncRecords(30);
      setRecentRecords(records);
    };
    load();
  }, [setRecentRecords]);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Sync</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sync customer and training data from external systems, and push local changes.
        </p>
      </div>
      <SyncPanel records={recentRecords} />
    </div>
  );
}
