'use client';

import { useState } from 'react';
import { Settings2, Palette, Database, Bell, RefreshCw, Keyboard } from 'lucide-react';
import { GeneralSettings } from '@/components/settings/GeneralSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { DataDefaultsSettings } from '@/components/settings/DataDefaultsSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { SyncSettings } from '@/components/settings/SyncSettings';
import { KeybindingsSettings } from '@/components/settings/KeybindingsSettings';
import { SubSidebar } from '@/components/layout/SubSidebar';

const TABS = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'data-defaults', label: 'Data & Defaults', icon: Database },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'sync', label: 'Sync', icon: RefreshCw },
  { id: 'keybindings', label: 'Keybindings', icon: Keyboard },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6">Settings</h1>
      <div className="flex gap-8 max-w-[960px] min-h-0">
        <SubSidebar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} className="min-w-[200px]" />
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'data-defaults' && <DataDefaultsSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'sync' && <SyncSettings />}
          {activeTab === 'keybindings' && <KeybindingsSettings />}
        </div>
      </div>
    </div>
  );
}
