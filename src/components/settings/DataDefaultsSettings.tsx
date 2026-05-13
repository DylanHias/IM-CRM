'use client';

import { useSettingsStore } from '@/store/settingsStore';
import { SettingRow } from './SettingRow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { RotateCcw } from 'lucide-react';
import { STAGES, type Stage } from '@/lib/opportunityRules';
import type { ReactNode } from 'react';

export function DataDefaultsSettings() {
  const {
    defaultActivityType,
    defaultActivityStatus,
    defaultCallDirection,
    defaultAppointmentDurationHours,
    defaultCustomerSort,
    defaultCustomerFilterOwner,
    noRecentActivityDays,
    defaultOpportunityCurrency,
    defaultOpportunityCountry,
    defaultOpportunityStage,
    defaultOpportunityExpirationDays,
    defaultFollowUpDueDays,
    updateSetting,
    resetSection,
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

      <Category title="Customers">
        <SettingRow label="Default customer sort" description="Initial sort when viewing the customer list">
          <Select value={defaultCustomerSort} onValueChange={(v) => updateSetting('defaultCustomerSort', v as 'name' | 'lastActivity' | 'city' | 'industry' | 'health')}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lastActivity">Last Activity</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="city">City</SelectItem>
              <SelectItem value="industry">Industry</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Show only my customers by default" description="Pre-filter the customer list to records you own">
          <Switch
            checked={defaultCustomerFilterOwner}
            onCheckedChange={(v) => updateSetting('defaultCustomerFilterOwner', v)}
          />
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
      </Category>

      <Divider />

      <Category title="Activities">
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

        <SettingRow label="Default activity status" description="Pre-selected status for new meetings, visits, and calls">
          <Select value={defaultActivityStatus} onValueChange={(v) => updateSetting('defaultActivityStatus', v as 'open' | 'completed')}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Default call direction" description="Pre-selected direction when logging a new call">
          <Select value={defaultCallDirection} onValueChange={(v) => updateSetting('defaultCallDirection', v as 'outgoing' | 'incoming')}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outgoing">Outgoing</SelectItem>
              <SelectItem value="incoming">Incoming</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Default appointment duration" description="How long a new meeting or visit lasts by default">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              max={24}
              step={0.5}
              value={defaultAppointmentDurationHours}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (val >= 0.5 && val <= 24) updateSetting('defaultAppointmentDurationHours', val);
              }}
              className="w-[64px] h-8 text-xs text-center"
            />
            <span className="text-xs text-muted-foreground">hours</span>
          </div>
        </SettingRow>
      </Category>

      <Divider />

      <Category title="Opportunities">
        <SettingRow label="Default currency" description="Pre-selected currency on new opportunities">
          <Select value={defaultOpportunityCurrency} onValueChange={(v) => updateSetting('defaultOpportunityCurrency', v as 'EUR' | 'USD')}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Default country" description="Pre-selected country on new opportunities">
          <Select value={defaultOpportunityCountry} onValueChange={(v) => updateSetting('defaultOpportunityCountry', v as 'Belgium' | 'Netherlands')}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Belgium">Belgium</SelectItem>
              <SelectItem value="Netherlands">Netherlands</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Default stage" description="Initial stage assigned to new opportunities">
          <Select value={defaultOpportunityStage} onValueChange={(v) => updateSetting('defaultOpportunityStage', v as Stage)}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Default expiration offset" description="Days from today when a new opportunity expires">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              max={365}
              value={defaultOpportunityExpirationDays}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1 && val <= 365) updateSetting('defaultOpportunityExpirationDays', val);
              }}
              className="w-[64px] h-8 text-xs text-center"
            />
            <span className="text-xs text-muted-foreground">days</span>
          </div>
        </SettingRow>
      </Category>

      <Divider />

      <Category title="Follow-ups">
        <SettingRow label="Default due date offset" description="Days from today when a new follow-up is due">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={90}
              value={defaultFollowUpDueDays}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 0 && val <= 90) updateSetting('defaultFollowUpDueDays', val);
              }}
              className="w-[64px] h-8 text-xs text-center"
            />
            <span className="text-xs text-muted-foreground">days</span>
          </div>
        </SettingRow>
      </Category>
    </div>
  );
}

function Category({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border" />;
}
