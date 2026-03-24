'use client';

import { useSettingsStore } from '@/store/settingsStore';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export function DataManagementSettings() {
  const {
    defaultExportFormat, mockDataEnabled,
    updateSetting, resetSection,
  } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Data Management</h2>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => resetSection('dataManagement')}>
          <RotateCcw size={12} className="mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-5">
        <SettingRow label="Default export format" description="File format when exporting data">
          <Select value={defaultExportFormat} onValueChange={(v) => updateSetting('defaultExportFormat', v as 'xlsx' | 'csv')}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
              <SelectItem value="csv">CSV (.csv)</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Use mock data" description="Load sample data instead of real synced data">
          <Switch
            checked={mockDataEnabled}
            onCheckedChange={(v) => updateSetting('mockDataEnabled', v)}
          />
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
