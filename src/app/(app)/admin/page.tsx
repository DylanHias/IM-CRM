'use client';

import { useState } from 'react';
import { ShieldX } from 'lucide-react';
import { UserManagement } from '@/components/admin/UserManagement';
import { AnalyticsReports } from '@/components/admin/AnalyticsReports';
import { DataManagement } from '@/components/admin/DataManagement';
import { DatabaseExplorer } from '@/components/admin/DatabaseExplorer';
import { PowerBiSchemaViewer } from '@/components/admin/PowerBiSchemaViewer';
import { PowerBiDiscovery } from '@/components/admin/PowerBiDiscovery';
import { RevenueAdmin } from '@/components/admin/RevenueAdmin';
import { AnimatedTabPanels } from '@/components/layout/AnimatedTabPanels';
import { ViewBar, ViewBarSeparator } from '@/components/ui/view-bar';
import { Segmented } from '@/components/ui/segmented';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthStore } from '@/store/authStore';

type TabId = 'analytics' | 'users' | 'data' | 'database' | 'powerbi' | 'powerbi-discovery' | 'revenue-sync';

const PEOPLE_TABS: { value: TabId; label: string }[] = [
  { value: 'analytics', label: 'Analytics' },
  { value: 'users', label: 'Users' },
];

const SYSTEM_TABS: { value: TabId; label: string }[] = [
  { value: 'data', label: 'Data' },
  { value: 'database', label: 'Database' },
  { value: 'powerbi', label: 'PowerBI' },
  { value: 'powerbi-discovery', label: 'Discovery' },
  { value: 'revenue-sync', label: 'Revenue Sync' },
];

export default function AdminPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [activeTab, setActiveTab] = useState<TabId>('analytics');

  if (!isAdmin) {
    return (
      <>
        <ViewBar title="Admin" />
        <EmptyState icon={ShieldX} title="Access denied" description="You need admin privileges to view this page." className="py-20" />
      </>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      <ViewBar title="Admin">
        <Segmented aria-label="People" value={activeTab} onChange={setActiveTab} options={PEOPLE_TABS} />
        <ViewBarSeparator />
        <Segmented aria-label="System" value={activeTab} onChange={setActiveTab} options={SYSTEM_TABS} />
      </ViewBar>
      <AnimatedTabPanels activeKey={activeTab}>
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'analytics' && <AnalyticsReports onGoToUsers={() => setActiveTab('users')} />}
        {activeTab === 'data' && <DataManagement />}
        {activeTab === 'database' && <DatabaseExplorer />}
        {activeTab === 'powerbi' && <PowerBiSchemaViewer />}
        {activeTab === 'powerbi-discovery' && <PowerBiDiscovery />}
        {activeTab === 'revenue-sync' && <RevenueAdmin />}
      </AnimatedTabPanels>
    </div>
  );
}
