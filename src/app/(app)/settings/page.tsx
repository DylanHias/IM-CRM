'use client';

import { useState } from 'react';
import { Palette, Database, Bell, RefreshCw } from 'lucide-react';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { DataDefaultsSettings } from '@/components/settings/DataDefaultsSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { SyncSettings } from '@/components/settings/SyncSettings';
import styled from 'styled-components';

const TABS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'data-defaults', label: 'Data & Defaults', icon: Database },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'sync', label: 'Sync', icon: RefreshCw },
] as const;

type TabId = (typeof TABS)[number]['id'];

const Container = styled.div`
  display: flex;
  gap: 32px;
  max-width: 960px;
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('appearance');

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6">Settings</h1>
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
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'data-defaults' && <DataDefaultsSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'sync' && <SyncSettings />}
        </Panel>
      </Container>
    </div>
  );
}
