'use client';

import { useSettingsStore, type SyncToastVerbosity } from '@/store/settingsStore';
import { SettingRow } from './SettingRow';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw } from 'lucide-react';

export function NotificationSettings() {
  const {
    followUpReminderDays, overdueAlertsOnLaunch, dueTodayAlertsOnLaunch,
    opportunityStaleReminderDays, opportunityExpiringReminderDays, dailyDigestOnLaunch,
    showSyncToasts, showConnectivityToasts, showUpdateToasts,
    muteAllNonCriticalToasts, syncToastVerbosity, syncFailureNotificationThreshold,
    quietHoursEnabled, quietHoursStart, quietHoursEnd,
    nativeOsNotifications, soundOnAlertEnabled, toastDurationSeconds,
    updateSetting, resetSection,
  } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Notifications & Reminders</h2>
        <ConfirmPopover message="Reset notification settings to defaults?" confirmLabel="Reset" onConfirm={() => resetSection('notifications')}>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
            <RotateCcw size={12} className="mr-1" />
            Reset
          </Button>
        </ConfirmPopover>
      </div>

      <div className="space-y-5">
        <SettingRow label="Mute non-critical toasts" description="Suppress success/info toasts everywhere; errors still come through">
          <Switch
            checked={muteAllNonCriticalToasts}
            onCheckedChange={(v) => updateSetting('muteAllNonCriticalToasts', v)}
          />
        </SettingRow>

        <SettingRow label="Toast duration" description="How long toasts stay on screen">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              max={30}
              value={toastDurationSeconds}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1 && val <= 30) updateSetting('toastDurationSeconds', val);
              }}
              className="w-[64px] h-8 text-xs text-center"
            />
            <span className="text-xs text-muted-foreground">seconds</span>
          </div>
        </SettingRow>

        <SettingRow label="Native OS notifications" description="Also surface alerts via the system notification centre (visible when the window is minimized)">
          <Switch
            checked={nativeOsNotifications}
            onCheckedChange={(v) => updateSetting('nativeOsNotifications', v)}
          />
        </SettingRow>

        <SettingRow label="Play sound on warnings/errors" description="Short beep when a warning or error toast fires">
          <Switch
            checked={soundOnAlertEnabled}
            onCheckedChange={(v) => updateSetting('soundOnAlertEnabled', v)}
          />
        </SettingRow>

        <SettingRow label="Quiet hours" description="Suppress non-critical toasts during this window">
          <Switch
            checked={quietHoursEnabled}
            onCheckedChange={(v) => updateSetting('quietHoursEnabled', v)}
          />
        </SettingRow>

        {quietHoursEnabled && (
          <SettingRow label="Quiet hours range" description="Start and end (24h)">
            <div className="flex items-center gap-1.5">
              <Input
                type="time"
                value={quietHoursStart}
                onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                className="w-[88px] h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="time"
                value={quietHoursEnd}
                onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                className="w-[88px] h-8 text-xs"
              />
            </div>
          </SettingRow>
        )}

        <SettingRow label="Daily digest on launch" description="Combine all launch reminders into a single rollup toast">
          <Switch
            checked={dailyDigestOnLaunch}
            onCheckedChange={(v) => updateSetting('dailyDigestOnLaunch', v)}
          />
        </SettingRow>

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

        <SettingRow label="Overdue alerts on launch" description="Alert when follow-ups are past their due date">
          <Switch
            checked={overdueAlertsOnLaunch}
            onCheckedChange={(v) => updateSetting('overdueAlertsOnLaunch', v)}
          />
        </SettingRow>

        <SettingRow label="Due today alerts on launch" description="Alert when follow-ups are due today">
          <Switch
            checked={dueTodayAlertsOnLaunch}
            onCheckedChange={(v) => updateSetting('dueTodayAlertsOnLaunch', v)}
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

        <SettingRow label="Opportunity expiring soon" description="Flag opportunities whose expiration date is within this window (0 = off)">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={0}
              max={90}
              value={opportunityExpiringReminderDays}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 0 && val <= 90) updateSetting('opportunityExpiringReminderDays', val);
              }}
              className="w-[64px] h-8 text-xs text-center"
            />
            <span className="text-xs text-muted-foreground">days</span>
          </div>
        </SettingRow>

        <SettingRow label="Show sync toasts" description="Display notifications when sync completes or fails">
          <Switch
            checked={showSyncToasts}
            onCheckedChange={(v) => updateSetting('showSyncToasts', v)}
          />
        </SettingRow>

        <SettingRow label="Sync toast verbosity" description="Which sync outcomes show up as toasts">
          <Select value={syncToastVerbosity} onValueChange={(v) => updateSetting('syncToastVerbosity', v as SyncToastVerbosity)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Success + errors</SelectItem>
              <SelectItem value="errors">Errors only</SelectItem>
              <SelectItem value="silent">Silent</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Sync failure threshold" description="Only show a failure toast after this many consecutive failed sync attempts">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              max={10}
              value={syncFailureNotificationThreshold}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1 && val <= 10) updateSetting('syncFailureNotificationThreshold', val);
              }}
              className="w-[64px] h-8 text-xs text-center"
            />
            <span className="text-xs text-muted-foreground">failures</span>
          </div>
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
      </div>
    </div>
  );
}
