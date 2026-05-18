'use client';

import { useState } from 'react';
import { Terminal, RefreshCw, ArrowLeftRight } from 'lucide-react';
import { ConsoleViewer } from '@/components/admin/ConsoleViewer';
import { SyncAdministration } from '@/components/admin/SyncAdministration';
import { RevenueCacheTransfer } from '@/components/admin/RevenueCacheTransfer';
import { SubSidebar } from '@/components/layout/SubSidebar';
import { AnimatedTabPanels } from '@/components/layout/AnimatedTabPanels';

const TABS = [
  { id: 'console', label: 'Console', icon: Terminal },
  { id: 'sync', label: 'Sync Logs', icon: RefreshCw },
  { id: 'revenue-cache', label: 'Revenue Cache', icon: ArrowLeftRight },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function DebugPage() {
  const [activeTab, setActiveTab] = useState<TabId>('console');

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6">Debug</h1>
      <div className="flex gap-8 min-h-0">
        <SubSidebar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="flex-1 min-w-0">
          <AnimatedTabPanels activeKey={activeTab}>
            {activeTab === 'console' && <ConsoleViewer />}
            {activeTab === 'sync' && <SyncAdministration />}
            {activeTab === 'revenue-cache' && <RevenueCacheTransfer />}
          </AnimatedTabPanels>
        </div>
      </div>
    </div>
  );
}
