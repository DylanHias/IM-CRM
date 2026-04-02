'use client';

import { useState } from 'react';
import { Terminal, RefreshCw } from 'lucide-react';
import { ConsoleViewer } from '@/components/admin/ConsoleViewer';
import { SyncAdministration } from '@/components/admin/SyncAdministration';
import { SubSidebar } from '@/components/layout/SubSidebar';

const TABS = [
  { id: 'console', label: 'Console', icon: Terminal },
  { id: 'sync', label: 'Sync Logs', icon: RefreshCw },
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
          {activeTab === 'console' && <ConsoleViewer />}
          {activeTab === 'sync' && <SyncAdministration />}
        </div>
      </div>
    </div>
  );
}
