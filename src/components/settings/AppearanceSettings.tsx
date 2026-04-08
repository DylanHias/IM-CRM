'use client';

import { useSettingsStore, type SidebarTab } from '@/store/settingsStore';
import { SettingRow } from './SettingRow';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { Separator } from '@/components/ui/separator';
import { RotateCcw, GripVertical, Users, RefreshCw, CheckSquare, Target, FileText, BarChart2 } from 'lucide-react';
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
  '/revenue-overview': { label: 'Revenue Overview', icon: BarChart2 },
};

export function AppearanceSettings() {
  const { theme, accentColor, compactMode, sidebarDefaultExpanded, sidebarOrder, updateSetting, resetSection } =
    useSettingsStore();
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
        <ConfirmPopover message="Reset appearance settings to defaults?" confirmLabel="Reset" onConfirm={() => resetSection('appearance')}>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
            <RotateCcw size={12} className="mr-1" />
            Reset
          </Button>
        </ConfirmPopover>
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

    </div>
  );
}

function SortableTabItem({ id }: { id: SidebarTab }) {
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
