'use client';

import { useState } from 'react';
import { Users, ScrollText, RefreshCw, BarChart3, HardDrive } from 'lucide-react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { UserManagement } from '@/components/admin/UserManagement';
import { AuditLog } from '@/components/admin/AuditLog';
import { SyncAdministration } from '@/components/admin/SyncAdministration';
import { AnalyticsReports } from '@/components/admin/AnalyticsReports';
import { DataManagement } from '@/components/admin/DataManagement';
import styled from 'styled-components';

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
  { id: 'sync', label: 'Sync', icon: RefreshCw },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'data', label: 'Data', icon: HardDrive },
] as const;

type TabId = (typeof TABS)[number]['id'];

const Container = styled.div`
  display: flex;
  gap: 32px;
  min-height: 0;
`;

const TabList = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 200px;
  flex-shrink: 0;
`;

const TabButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background-color: ${(p) => (p.$active ? 'hsl(var(--secondary))' : 'transparent')};
  color: ${(p) => (p.$active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))')};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background-color: hsl(var(--secondary));
    color: hsl(var(--foreground));
  }
`;

const Panel = styled.div`
  flex: 1;
  min-width: 0;
`;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('users');

  return (
    <AdminGuard>
      <div>
        <h1 className="text-lg font-semibold mb-6">Admin Panel</h1>
        <Container>
          <TabList>
            {TABS.map(({ id, label, icon: Icon }) => (
              <TabButton
                key={id}
                $active={activeTab === id}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={15} />
                {label}
              </TabButton>
            ))}
          </TabList>
          <Panel>
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'audit' && <AuditLog />}
            {activeTab === 'sync' && <SyncAdministration />}
            {activeTab === 'analytics' && <AnalyticsReports />}
            {activeTab === 'data' && <DataManagement />}
          </Panel>
        </Container>
      </div>
    </AdminGuard>
  );
}
