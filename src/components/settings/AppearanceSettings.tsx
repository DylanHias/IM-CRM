'use client';

import { useState, useCallback, useRef } from 'react';
import { useSettingsStore, type SidebarTab } from '@/store/settingsStore';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, GripVertical, Users, RefreshCw, CheckSquare, Target, FileText, BarChart2, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { storeChangelog } from '@/components/layout/ChangelogDialog';
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

const SIDEBAR_TAB_META: Record<SidebarTab, { label: string; icon: typeof Users }> = {
  '/customers': { label: 'Customers', icon: Users },
  '/sync': { label: 'Sync', icon: RefreshCw },
  '/followups': { label: 'Follow-Ups', icon: CheckSquare },
  '/opportunities': { label: 'Opportunities', icon: Target },
  '/invoices': { label: 'Invoices', icon: FileText },
  '/arr-overview': { label: 'ARR Overview', icon: BarChart2 },
};

export function AppearanceSettings() {
  const { theme, accentColor, compactMode, sidebarDefaultExpanded, sidebarOrder, updateSetting, resetSection } =
    useSettingsStore();
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'up-to-date'>('idle');
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const updateRef = useRef<Awaited<ReturnType<typeof import('@tauri-apps/plugin-updater').check>> | null>(null);

  const checkForUpdates = useCallback(async () => {
    if (!isTauriApp()) return;
    setUpdateStatus('checking');
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (update) {
        updateRef.current = update;
        setUpdateStatus('available');
        setUpdateVersion(update.version);
      } else {
        setUpdateStatus('up-to-date');
      }
    } catch (error) {
      console.error('[updater] Failed to check for updates:', error);
      setUpdateStatus('idle');
    }
  }, []);

  const installUpdate = useCallback(async () => {
    const update = updateRef.current;
    if (!update) return;
    try {
      setUpdateStatus('downloading');
      if (update.body) {
        await storeChangelog(update.body, update.version);
      }
      await update.downloadAndInstall();
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (error) {
      console.error('[updater] Failed to install update:', error);
      setUpdateStatus('available');
    }
  }, []);

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
                <SortableTabItem key={tab} id={tab} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Updates</p>
          <p className="text-xs text-muted-foreground">
            {updateStatus === 'downloading'
              ? `Downloading version ${updateVersion}...`
              : updateStatus === 'available' && updateVersion
                ? `Version ${updateVersion} is available`
                : updateStatus === 'up-to-date'
                  ? 'You\'re on the latest version'
                  : 'Check if a newer version is available'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
          onClick={updateStatus === 'available' ? installUpdate : checkForUpdates}
        >
          {updateStatus === 'checking' ? (
            <><Loader2 size={13} className="mr-1.5 animate-spin" />Checking...</>
          ) : updateStatus === 'downloading' ? (
            <><Loader2 size={13} className="mr-1.5 animate-spin" />Downloading...</>
          ) : updateStatus === 'up-to-date' ? (
            <><CheckCircle2 size={13} className="mr-1.5" />Up to date</>
          ) : updateStatus === 'available' ? (
            <><Download size={13} className="mr-1.5" />Install update</>
          ) : (
            <><Download size={13} className="mr-1.5" />Check for updates</>
          )}
        </Button>
      </div>
    </div>
  );
}

function SortableTabItem({ id }: { id: SidebarTab }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const meta = SIDEBAR_TAB_META[id];
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
