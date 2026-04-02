'use client';

import { useSettingsStore } from '@/store/settingsStore';
import { SettingRow } from './SettingRow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { RotateCcw } from 'lucide-react';

export function DataDefaultsSettings() {
  const {
    defaultActivityType, defaultCustomerSort,
    noRecentActivityDays, updateSetting, resetSection,
  } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Data & Defaults</h2>
        <ConfirmPopover message="Reset data & defaults settings to defaults?" confirmLabel="Reset" onConfirm={() => resetSection('dataDefaults')}>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
            <RotateCcw size={12} className="mr-1" />
            Reset
          </Button>
        </ConfirmPopover>
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

        <SettingRow label="No recent activity threshold" description="Customers with no activity in this many days appear when you use the 'No activity' filter">
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
