'use client';

import { useSettingsStore } from '@/store/settingsStore';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export function DataDefaultsSettings() {
  const {
    defaultActivityType, defaultCustomerSort, defaultCustomerFilterOwner,
    itemsPerPage, noRecentActivityDays, updateSetting, resetSection,
  } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Data & Defaults</h2>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => resetSection('dataDefaults')}>
          <RotateCcw size={12} className="mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-5">
        <SettingRow label="Default activity type" description="Pre-selected type when logging a new activity">
          <Select value={defaultActivityType} onValueChange={(v) => updateSetting('defaultActivityType', v as 'meeting' | 'visit' | 'call' | 'note')}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="visit">Visit</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="note">Note</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Default customer sort" description="Initial sort when viewing the customer list">
          <Select value={defaultCustomerSort} onValueChange={(v) => updateSetting('defaultCustomerSort', v as 'name' | 'lastActivity' | 'city' | 'industry')}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastActivity">Last Activity</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="city">City</SelectItem>
              <SelectItem value="industry">Industry</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Show my customers first" description="Auto-apply 'my customers' filter on launch">
          <Switch
            checked={defaultCustomerFilterOwner}
            onCheckedChange={(v) => updateSetting('defaultCustomerFilterOwner', v)}
          />
        </SettingRow>

        <SettingRow label="Items per page" description="Number of items shown in list views">
          <Input
            type="number"
            min={10}
            max={200}
            step={10}
            value={itemsPerPage}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val >= 10 && val <= 200) updateSetting('itemsPerPage', val);
            }}
            className="w-[80px] h-8 text-xs text-center"
          />
        </SettingRow>

        <SettingRow label="No recent activity threshold" description="Days of inactivity before a customer is flagged">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={7}
              max={365}
              value={noRecentActivityDays}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 7 && val <= 365) updateSetting('noRecentActivityDays', val);
              }}
              className="w-[64px] h-8 text-xs text-center"
            />
            <span className="text-xs text-muted-foreground">days</span>
          </div>
        </SettingRow>
      </div>
    </div>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
