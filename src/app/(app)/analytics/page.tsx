'use client';

import { useState } from 'react';
import { User, Target, Users, Activity } from 'lucide-react';
import { SubSidebar } from '@/components/layout/SubSidebar';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { PersonalPanel } from '@/components/analytics/PersonalPanel';
import { PipelinePanel } from '@/components/analytics/PipelinePanel';
import { CustomersPanel } from '@/components/analytics/CustomersPanel';
import { ActivityPanel } from '@/components/analytics/ActivityPanel';

const TABS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'pipeline', label: 'Pipeline', icon: Target },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'activity', label: 'Activity', icon: Activity },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('personal');

  return (
    <AdminGuard>
      <div>
        <h1 className="text-lg font-semibold mb-6">Analytics</h1>
        <div className="flex gap-8 min-h-0">
          <SubSidebar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} className="min-w-[180px]" />
          <div className="flex-1 min-w-0">
            {activeTab === 'personal' && <PersonalPanel />}
            {activeTab === 'pipeline' && <PipelinePanel />}
            {activeTab === 'customers' && <CustomersPanel />}
            {activeTab === 'activity' && <ActivityPanel />}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
