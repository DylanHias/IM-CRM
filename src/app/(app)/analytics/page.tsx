'use client';

import { useState } from 'react';
import { User, Target, Users, Activity, RefreshCw } from 'lucide-react';
import { SubSidebar } from '@/components/layout/SubSidebar';
import { PersonalPanel } from '@/components/analytics/PersonalPanel';
import { PipelinePanel } from '@/components/analytics/PipelinePanel';
import { CustomersPanel } from '@/components/analytics/CustomersPanel';
import { ActivityPanel } from '@/components/analytics/ActivityPanel';
import { Button } from '@/components/ui/button';

const TABS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'pipeline', label: 'Pipeline', icon: Target },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'activity', label: 'Activity', icon: Activity },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('personal');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>
      <div className="flex gap-8 min-h-0">
        <SubSidebar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} className="min-w-[180px]" />
        <div className="flex-1 min-w-0">
          {activeTab === 'personal' && <PersonalPanel refreshKey={refreshKey} />}
          {activeTab === 'pipeline' && <PipelinePanel refreshKey={refreshKey} />}
          {activeTab === 'customers' && <CustomersPanel refreshKey={refreshKey} />}
          {activeTab === 'activity' && <ActivityPanel refreshKey={refreshKey} />}
        </div>
      </div>
    </div>
  );
}
