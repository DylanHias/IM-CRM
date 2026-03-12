'use client';

import { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { SyncPanel } from '@/components/sync/SyncPanel';
import { useSyncStore } from '@/store/syncStore';
import { queryRecentSyncRecords } from '@/lib/db/queries/sync';
import { isTauriApp } from '@/lib/utils/offlineUtils';

export default function SyncPage() {
  const { recentRecords, setRecentRecords } = useSyncStore();

  useEffect(() => {
    if (!isTauriApp()) return;
    queryRecentSyncRecords(30).then(setRecentRecords);
  }, [setRecentRecords]);

  return (
    <AuthGuard>
      <AppShell title="Sync Status">
        <div className="max-w-3xl mx-auto space-y-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Sync</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Sync customer and training data from external systems, and push local changes.
            </p>
          </div>
          <SyncPanel records={recentRecords} />
        </div>
      </AppShell>
    </AuthGuard>
  );
}
