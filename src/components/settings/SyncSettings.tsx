'use client';

import { useSettingsStore } from '@/store/settingsStore';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export function SyncSettings() {
  const {
    autoSyncOnLaunch, syncIntervalMinutes,
    updateSetting, resetSection,
  } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Sync</h2>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => resetSection('sync')}>
          <RotateCcw size={12} className="mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-5">
        <SettingRow label="Auto-sync on launch" description="Automatically sync data when the app starts">
          <Switch
            checked={autoSyncOnLaunch}
            onCheckedChange={(v) => updateSetting('autoSyncOnLaunch', v)}
          />
        </SettingRow>

        <SettingRow label="Sync interval" description="Minutes between automatic background syncs">
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={5}
              max={120}
              step={5}
              value={syncIntervalMinutes}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 5 && val <= 120) updateSetting('syncIntervalMinutes', val);
              }}
              className="w-[64px] h-8 text-xs text-center"
            />
            <span className="text-xs text-muted-foreground">min</span>
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
