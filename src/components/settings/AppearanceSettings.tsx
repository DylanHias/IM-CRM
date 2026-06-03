'use client';

import { useState } from 'react';
import { useSettingsStore, type SidebarTab, type Density, type FontScale, type FontFamily, type TableRowDensity } from '@/store/settingsStore';
import { SettingRow } from './SettingRow';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, GripVertical, Users, RefreshCw, CheckSquare, Target, BarChart2, LineChart, Gauge, Clock, LayoutDashboard, Eye, EyeOff, Sun, Moon, Monitor, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { EasterEggsSettings } from './EasterEggsSettings';

type Theme = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink';

const ACCENT_COLORS: { value: AccentColor; label: string; hex: string }[] = [
  { value: 'blue', label: 'Blue', hex: '#1f6feb' },
  { value: 'purple', label: 'Purple', hex: '#7c3aed' },
  { value: 'green', label: 'Green', hex: '#16a34a' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'red', label: 'Red', hex: '#ef4444' },
  { value: 'pink', label: 'Pink', hex: '#ec4899' },
];

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

const SIDEBAR_TAB_META: Record<SidebarTab, { label: string; icon: typeof Users }> = {
  '/dashboard': { label: 'Dashboard', icon: LayoutDashboard },
  '/customers': { label: 'Customers', icon: Users },
  '/sync': { label: 'Sync', icon: RefreshCw },
  '/followups': { label: 'Follow-Ups', icon: CheckSquare },
  '/opportunities': { label: 'Opportunities', icon: Target },
  '/revenue-overview': { label: 'Revenue Overview', icon: BarChart2 },
  '/insights': { label: 'Insights', icon: Gauge },
  '/analytics': { label: 'Analytics', icon: LineChart },
  '/timeline': { label: 'Timeline', icon: Clock },
  '/ai': { label: 'AI Assistant', icon: Sparkles },
};

function applyThemePreview(theme: Theme) {
  const root = document.documentElement;
  let resolved: 'light' | 'dark';
  if (theme === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    resolved = theme;
  }
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
}

function applyAccentPreview(accent: AccentColor) {
  const root = document.documentElement;
  root.classList.remove('accent-blue', 'accent-purple', 'accent-green', 'accent-orange', 'accent-red', 'accent-pink');
  if (accent !== 'blue') root.classList.add(`accent-${accent}`);
}

export function AppearanceSettings() {
  const {
    theme,
    accentColor,
    customAccentHex,
    density,
    fontScale,
    fontFamily,
    tableRowDensity,
    highContrast,
    reduceMotion,
    autoThemeByTime,
    autoThemeDarkStartHour,
    autoThemeLightStartHour,
    defaultLandingTab,
    sidebarDefaultExpanded,
    sidebarRememberLastState,
    sidebarOrder,
    sidebarHiddenTabs,
    updateSetting,
    resetSection,
  } = useSettingsStore();

  const [hexDraft, setHexDraft] = useState(customAccentHex ?? '');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sidebarOrder.indexOf(active.id as SidebarTab);
    const newIndex = sidebarOrder.indexOf(over.id as SidebarTab);
    updateSetting('sidebarOrder', arrayMove(sidebarOrder, oldIndex, newIndex));
  };

  const resetThemeColors = () => {
    updateSetting('theme', 'light');
    updateSetting('accentColor', 'blue');
    updateSetting('customAccentHex', null);
    updateSetting('highContrast', false);
    updateSetting('autoThemeByTime', false);
    updateSetting('autoThemeDarkStartHour', 19);
    updateSetting('autoThemeLightStartHour', 7);
    setHexDraft('');
  };

  const resetLayout = () => {
    updateSetting('density', 'comfortable');
    updateSetting('fontScale', 'md');
    updateSetting('fontFamily', 'sans');
    updateSetting('tableRowDensity', 'comfortable');
    updateSetting('reduceMotion', false);
  };

  const resetSidebar = () => {
    updateSetting('sidebarDefaultExpanded', false);
    updateSetting('sidebarRememberLastState', true);
    updateSetting('defaultLandingTab', '/dashboard');
    updateSetting('sidebarOrder', Object.keys(SIDEBAR_TAB_META) as SidebarTab[]);
    updateSetting('sidebarHiddenTabs', []);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <ConfirmPopover message="Reset all appearance settings to defaults?" confirmLabel="Reset" onConfirm={() => resetSection('appearance')}>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
            <RotateCcw size={12} className="mr-1" />
            Reset all
          </Button>
        </ConfirmPopover>
      </div>

      {/* THEME & COLORS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Theme & colors</p>
          <ConfirmPopover message="Reset theme and color settings?" confirmLabel="Reset" onConfirm={resetThemeColors}>
            <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground">Reset</Button>
          </ConfirmPopover>
        </div>

        <SettingRow label="Theme" description="Light, dark, or follow your system">
          <div className="flex gap-1 rounded-lg border bg-muted/30 p-0.5">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => updateSetting('theme', value)}
                onMouseEnter={() => !autoThemeByTime && applyThemePreview(value)}
                onMouseLeave={() => !autoThemeByTime && applyThemePreview(theme)}
                title={label}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors',
                  theme === value ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow label="Auto-theme by time of day" description="Switch to dark in the evening, light in the morning">
          <Switch checked={autoThemeByTime} onCheckedChange={(v) => updateSetting('autoThemeByTime', v)} />
        </SettingRow>

        {autoThemeByTime && (
          <SettingRow label="Dark from / light from" description="Hour (0–23) to switch to each theme">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={23}
                value={autoThemeDarkStartHour}
                onChange={(e) => updateSetting('autoThemeDarkStartHour', Math.max(0, Math.min(23, parseInt(e.target.value, 10) || 0)))}
                className="w-16 h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">/</span>
              <Input
                type="number"
                min={0}
                max={23}
                value={autoThemeLightStartHour}
                onChange={(e) => updateSetting('autoThemeLightStartHour', Math.max(0, Math.min(23, parseInt(e.target.value, 10) || 0)))}
                className="w-16 h-8 text-xs"
              />
            </div>
          </SettingRow>
        )}

        <SettingRow label="Accent color" description="Primary color used across the app">
          <div className="flex items-center gap-1.5">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.value}
                title={c.label}
                style={{ backgroundColor: c.hex }}
                onClick={() => {
                  updateSetting('accentColor', c.value);
                  updateSetting('customAccentHex', null);
                  setHexDraft('');
                }}
                onMouseEnter={() => !customAccentHex && applyAccentPreview(c.value)}
                onMouseLeave={() => !customAccentHex && applyAccentPreview(accentColor)}
                className={cn(
                  'w-6 h-6 rounded-full transition-all',
                  !customAccentHex && accentColor === c.value
                    ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground/30 scale-110'
                    : 'hover:scale-105'
                )}
              />
            ))}
          </div>
        </SettingRow>

        <SettingRow label="Custom accent (hex)" description="Override presets with a custom color, e.g. #ff6b35">
          <div className="flex items-center gap-1.5">
            <Input
              value={hexDraft}
              onChange={(e) => setHexDraft(e.target.value)}
              placeholder="#1f6feb"
              className="w-28 h-8 text-xs font-mono"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                const v = hexDraft.trim();
                if (/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.test(v)) {
                  updateSetting('customAccentHex', v.startsWith('#') ? v : `#${v}`);
                }
              }}
            >
              Apply
            </Button>
            {customAccentHex && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  updateSetting('customAccentHex', null);
                  setHexDraft('');
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </SettingRow>

        <SettingRow label="High contrast" description="Stronger borders and muted text for readability">
          <Switch checked={highContrast} onCheckedChange={(v) => updateSetting('highContrast', v)} />
        </SettingRow>
      </div>

      <Separator />

      {/* LAYOUT & TYPOGRAPHY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Layout & typography</p>
          <ConfirmPopover message="Reset layout settings?" confirmLabel="Reset" onConfirm={resetLayout}>
            <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground">Reset</Button>
          </ConfirmPopover>
        </div>

        <SettingRow label="Density" description="Controls spacing across the app">
          <Select value={density} onValueChange={(v) => updateSetting('density', v as Density)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">Comfortable</SelectItem>
              <SelectItem value="cozy">Cozy</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Font size" description="Scale all text proportionally">
          <Select value={fontScale} onValueChange={(v) => updateSetting('fontScale', v as FontScale)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="UI font" description="Font family used across the app">
          <Select value={fontFamily} onValueChange={(v) => updateSetting('fontFamily', v as FontFamily)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sans">DM Sans</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="serif">Serif</SelectItem>
              <SelectItem value="mono">Monospace</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Table row density" description="Row padding in all data tables">
          <Select value={tableRowDensity} onValueChange={(v) => updateSetting('tableRowDensity', v as TableRowDensity)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">Comfortable</SelectItem>
              <SelectItem value="cozy">Cozy</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Reduce motion" description="Disable transitions and animations">
          <Switch checked={reduceMotion} onCheckedChange={(v) => updateSetting('reduceMotion', v)} />
        </SettingRow>
      </div>

      <Separator />

      {/* SIDEBAR & NAVIGATION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sidebar & navigation</p>
          <ConfirmPopover message="Reset sidebar settings?" confirmLabel="Reset" onConfirm={resetSidebar}>
            <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground">Reset</Button>
          </ConfirmPopover>
        </div>

        <SettingRow label="Default landing tab" description="The page that opens when you launch the app">
          <Select value={defaultLandingTab} onValueChange={(v) => updateSetting('defaultLandingTab', v as SidebarTab)}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SIDEBAR_TAB_META) as SidebarTab[]).map((tab) => (
                <SelectItem key={tab} value={tab}>{SIDEBAR_TAB_META[tab].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow label="Remember last sidebar state" description="When off, the sidebar starts in the default state on every launch">
          <Switch checked={sidebarRememberLastState} onCheckedChange={(v) => updateSetting('sidebarRememberLastState', v)} />
        </SettingRow>

        <SettingRow label="Sidebar expanded by default" description="Used when 'remember last state' is off">
          <Switch
            checked={sidebarDefaultExpanded}
            onCheckedChange={(v) => updateSetting('sidebarDefaultExpanded', v)}
          />
        </SettingRow>
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Sidebar tab order</p>
          <p className="text-xs text-muted-foreground">Drag to reorder the tabs in the sidebar</p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <SortableContext items={sidebarOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {sidebarOrder.map((tab) => (
                <SortableTabItem
                  key={tab}
                  id={tab}
                  hidden={sidebarHiddenTabs.includes(tab)}
                  onToggleHidden={() => {
                    const next = sidebarHiddenTabs.includes(tab)
                      ? sidebarHiddenTabs.filter((t) => t !== tab)
                      : [...sidebarHiddenTabs, tab];
                    updateSetting('sidebarHiddenTabs', next);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <EasterEggsSettings />

    </div>
  );
}

function SortableTabItem({ id, hidden, onToggleHidden }: { id: SidebarTab; hidden: boolean; onToggleHidden: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const meta = SIDEBAR_TAB_META[id];
  if (!meta) return null;
  const Icon = meta.icon;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-card px-3 py-2 text-sm',
        isDragging ? 'z-50 shadow-md border-primary/30 bg-card/95' : 'border-border',
        hidden && 'opacity-50',
      )}
    >
      <button
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>
      <Icon size={14} className="text-muted-foreground flex-shrink-0" />
      <span className="text-sm">{meta.label}</span>
      <button
        className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
        onClick={onToggleHidden}
        title={hidden ? 'Show in sidebar' : 'Hide from sidebar'}
      >
        {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}
