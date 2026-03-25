'use client';

import { useSettingsStore } from '@/store/settingsStore';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export function NotificationSettings() {
  const {
    followUpReminderDays, overdueAlertsOnLaunch, dueTodayAlertsOnLaunch,
    opportunityStaleReminderDays, showSyncToasts, showConnectivityToasts, showUpdateToasts,
    updateSetting, resetSection,
  } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Notifications & Reminders</h2>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => resetSection('notifications')}>
          <RotateCcw size={12} className="mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-5">
        <SettingRow label="Follow-up reminder" description="Remind before a follow-up is due">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={14}
              value={followUpReminderDays}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 0 && val <= 14) updateSetting('followUpReminderDays', val);
              }}
              className="w-[64px] h-8 text-xs text-center"
            />
            <span className="text-xs text-muted-foreground">days before</span>
          </div>
        </SettingRow>

        <SettingRow label="Overdue alerts on launch" description="Show overdue follow-ups when you open the app">
          <Switch
            checked={overdueAlertsOnLaunch}
            onCheckedChange={(v) => updateSetting('overdueAlertsOnLaunch', v)}
          />
        </SettingRow>

        <SettingRow label="Due today alerts on launch" description="Show follow-ups due today when you open the app">
          <Switch
            checked={dueTodayAlertsOnLaunch}
            onCheckedChange={(v) => updateSetting('dueTodayAlertsOnLaunch', v)}
          />
        </SettingRow>

        <SettingRow label="Show sync toasts" description="Display notifications when sync completes or fails">
          <Switch
            checked={showSyncToasts}
            onCheckedChange={(v) => updateSetting('showSyncToasts', v)}
          />
        </SettingRow>

        <SettingRow label="Connectivity alerts" description="Notify when you go offline or come back online">
          <Switch
            checked={showConnectivityToasts}
            onCheckedChange={(v) => updateSetting('showConnectivityToasts', v)}
          />
        </SettingRow>

        <SettingRow label="Update available alerts" description="Notify when a new version of the app is available">
          <Switch
            checked={showUpdateToasts}
            onCheckedChange={(v) => updateSetting('showUpdateToasts', v)}
          />
        </SettingRow>

        <SettingRow label="Opportunity stale reminder" description="Flag opportunities with no updates after this many days">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={7}
              max={180}
              value={opportunityStaleReminderDays}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 7 && val <= 180) updateSetting('opportunityStaleReminderDays', val);
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
