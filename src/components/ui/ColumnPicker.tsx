'use client';

import { useState, useRef } from 'react';
import { Columns3, GripVertical, RotateCcw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';

export interface ColumnDef {
  id: string;
  label: string;
}

interface Props {
  tableKey: string;
  columns: ColumnDef[];
}

export function useColumnConfig(tableKey: string, columns: ColumnDef[]) {
  const tableColumns = useSettingsStore((s) => s.tableColumns);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const saved = tableColumns[tableKey];
  const defaultOrder = columns.map((c) => c.id);

  const order = saved?.order ?? defaultOrder;
  const hidden = new Set(saved?.hidden ?? []);

  // Append any new columns not in saved order
  const allIds = new Set(columns.map((c) => c.id));
  const resolved = [
    ...order.filter((id) => allIds.has(id)),
    ...defaultOrder.filter((id) => !order.includes(id)),
  ];

  const visibleColumns = resolved.filter((id) => !hidden.has(id));

  function persist(newOrder: string[], newHidden: string[]) {
    updateSetting('tableColumns', {
      ...tableColumns,
      [tableKey]: { order: newOrder, hidden: newHidden },
    });
  }

  function toggleColumn(id: string) {
    const newHidden = hidden.has(id)
      ? [...saved?.hidden ?? []].filter((h) => h !== id)
      : [...(saved?.hidden ?? []), id];
    persist(resolved, newHidden);
  }

  function reorder(fromIndex: number, toIndex: number) {
    const newOrder = [...resolved];
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    persist(newOrder, saved?.hidden ?? []);
  }

  function reset() {
    const next = { ...tableColumns };
    delete next[tableKey];
    updateSetting('tableColumns', next);
  }

  return { visibleColumns, orderedColumns: resolved, hidden, toggleColumn, reorder, reset };
}

export function ColumnPicker({ tableKey, columns }: Props) {
  const { orderedColumns, hidden, toggleColumn, reorder, reset } = useColumnConfig(tableKey, columns);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const columnMap = new Map(columns.map((c) => [c.id, c]));

  function handleDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }

  function handleDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      reorder(dragIndex, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  const hasChanges = hidden.size > 0 || orderedColumns.join(',') !== columns.map((c) => c.id).join(',');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5">
          <Columns3 size={13} />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="space-y-0.5">
          {orderedColumns.map((id, index) => {
            const col = columnMap.get(id);
            if (!col) return null;
            const isVisible = !hidden.has(id);
            return (
              <div
                key={id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-grab active:cursor-grabbing select-none',
                  'hover:bg-muted/50 transition-colors',
                  dragIndex === index && 'opacity-50',
                  dragOverIndex === index && dragIndex !== index && 'border-t-2 border-primary'
                )}
              >
                <GripVertical size={12} className="text-muted-foreground shrink-0" />
                <Checkbox
                  checked={isVisible}
                  onCheckedChange={() => toggleColumn(id)}
                  className="shrink-0"
                />
                <span className={cn('truncate', !isVisible && 'text-muted-foreground')}>
                  {col.label}
                </span>
              </div>
            );
          })}
        </div>
        {hasChanges && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 mt-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
          >
            <RotateCcw size={11} />
            Reset to defaults
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
