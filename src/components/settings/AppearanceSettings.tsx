'use client';

import { useSettingsStore } from '@/store/settingsStore';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink';

const ACCENT_COLORS: { value: AccentColor; label: string; swatch: string }[] = [
  { value: 'blue', label: 'Blue', swatch: 'bg-[hsl(217,87%,51%)]' },
  { value: 'purple', label: 'Purple', swatch: 'bg-[hsl(263,70%,50%)]' },
  { value: 'green', label: 'Green', swatch: 'bg-[hsl(142,72%,37%)]' },
  { value: 'orange', label: 'Orange', swatch: 'bg-[hsl(25,95%,53%)]' },
  { value: 'red', label: 'Red', swatch: 'bg-[hsl(0,84%,60%)]' },
  { value: 'pink', label: 'Pink', swatch: 'bg-[hsl(330,81%,60%)]' },
];

export function AppearanceSettings() {
  const { theme, accentColor, compactMode, sidebarDefaultExpanded, updateSetting, resetSection } =
    useSettingsStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => resetSection('appearance')}>
          <RotateCcw size={12} className="mr-1" />
          Reset
        </Button>
      </div>

      <div className="space-y-5">
        <SettingRow label="Theme" description="Choose light, dark, or match your system">
          <Select value={theme} onValueChange={(v) => updateSetting('theme', v as Theme)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Accent color" description="Primary color used across the app">
          <div className="flex gap-1.5">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.value}
                title={c.label}
                onClick={() => updateSetting('accentColor', c.value)}
                className={cn(
                  'w-6 h-6 rounded-full transition-all',
                  c.swatch,
                  accentColor === c.value
                    ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground/30 scale-110'
                    : 'hover:scale-105'
                )}
              />
            ))}
          </div>
        </SettingRow>

        <SettingRow label="Compact mode" description="Reduce spacing and font sizes">
          <Switch
            checked={compactMode}
            onCheckedChange={(v) => updateSetting('compactMode', v)}
          />
        </SettingRow>

        <SettingRow label="Sidebar expanded by default" description="Start with sidebar expanded on launch">
          <Switch
            checked={sidebarDefaultExpanded}
            onCheckedChange={(v) => updateSetting('sidebarDefaultExpanded', v)}
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
