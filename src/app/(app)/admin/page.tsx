'use client';

import { useState } from 'react';
import { Users, BarChart3, HardDrive, TerminalSquare, PieChart, Search, RefreshCw } from 'lucide-react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { UserManagement } from '@/components/admin/UserManagement';
import { AnalyticsReports } from '@/components/admin/AnalyticsReports';
import { DataManagement } from '@/components/admin/DataManagement';
import { DatabaseExplorer } from '@/components/admin/DatabaseExplorer';
import { PowerBiSchemaViewer } from '@/components/admin/PowerBiSchemaViewer';
import { PowerBiDiscovery } from '@/components/admin/PowerBiDiscovery';
import { RevenueAdmin } from '@/components/admin/RevenueAdmin';
import { SubSidebar } from '@/components/layout/SubSidebar';
import { AnimatedTabPanels } from '@/components/layout/AnimatedTabPanels';

const TABS = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users, dividerAfter: true },
  { id: 'data', label: 'Data', icon: HardDrive },
  { id: 'database', label: 'Database', icon: TerminalSquare },
  { id: 'powerbi', label: 'PowerBI', icon: PieChart },
  { id: 'powerbi-discovery', label: 'PowerBI Discovery', icon: Search },
  { id: 'revenue-sync', label: 'Revenue Sync', icon: RefreshCw },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('analytics');

  return (
    <AdminGuard>
      <div>
        <h1 className="text-lg font-semibold mb-6">Admin Panel</h1>
        <div className="flex gap-8 min-h-0">
          <SubSidebar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} className="min-w-[200px]" />
          <div className="flex-1 min-w-0">
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
        </div>
      </div>
    </AdminGuard>
  );
}
