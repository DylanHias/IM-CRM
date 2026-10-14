'use client';

import { useState } from 'react';
import { ConsoleViewer } from '@/components/debug/ConsoleViewer';
import { SyncLogs } from '@/components/debug/SyncLogs';
import { RevenueCacheTransfer } from '@/components/debug/RevenueCacheTransfer';
import { ViewBar } from '@/components/ui/view-bar';
import { Segmented } from '@/components/ui/segmented';

type TabId = 'console' | 'sync' | 'revenue-cache';

const TABS: { value: TabId; label: string }[] = [
  { value: 'console', label: 'Console' },
  { value: 'sync', label: 'Sync Logs' },
  { value: 'revenue-cache', label: 'Revenue Cache' },
];

export default function DebugPage() {
  const [activeTab, setActiveTab] = useState<TabId>('console');
  const tabs = <Segmented aria-label="Debug view" value={activeTab} onChange={setActiveTab} options={TABS} />;

  if (activeTab === 'console') return <ConsoleViewer tabs={tabs} />;
  if (activeTab === 'sync') return <SyncLogs tabs={tabs} />;
  return (
    <>
      <ViewBar title="Debug">{tabs}</ViewBar>
      <RevenueCacheTransfer />
    </>
  );
}
