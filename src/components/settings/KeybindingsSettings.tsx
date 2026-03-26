'use client';

import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Pencil, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { Separator } from '@/components/ui/separator';
import { KbdGroup } from '@/components/ui/kbd';
import { useSettingsStore } from '@/store/settingsStore';
import {
  getAllShortcuts,
  getDefaultShortcuts,
  getDefaultBinding,
  getDisplayKey,
  findConflict,
  SHORTCUT_SECTIONS,
} from '@/lib/shortcuts/shortcuts';
import type { CustomKeybinding } from '@/lib/shortcuts/shortcuts';
import { cn } from '@/lib/utils';

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta']);

function captureBinding(e: KeyboardEvent): CustomKeybinding | null {
  if (MODIFIER_KEYS.has(e.key)) return null;

  return {
    key: e.key,
    ctrlKey: e.ctrlKey || e.metaKey || undefined,
    shiftKey: e.shiftKey || undefined,
    altKey: e.altKey || undefined,
  };
}

export function KeybindingsSettings() {
  const { customKeybindings, sidebarOrder, updateSetting, resetSection } = useSettingsStore();
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [conflict, setConflict] = useState<{ id: string; label: string } | null>(null);

  const currentShortcuts = getAllShortcuts(sidebarOrder, customKeybindings);
  const defaultShortcuts = getDefaultShortcuts(sidebarOrder);

  const isCustomized = useCallback(
    (id: string) => id in customKeybindings,
    [customKeybindings]
  );

  const resetSingle = useCallback(
    (id: string) => {
      const next = { ...customKeybindings };
      delete next[id];
      updateSetting('customKeybindings', next);
    },
    [customKeybindings, updateSetting]
  );

  useEffect(() => {
    if (!recordingId) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setRecordingId(null);
        setConflict(null);
        return;
      }

      const binding = captureBinding(e);
      if (!binding) return;

      // Check against all shortcuts with this candidate applied
      const prospective = getAllShortcuts(sidebarOrder, {
        ...customKeybindings,
        [recordingId]: binding,
      });
      const conflicting = findConflict(prospective, recordingId, binding);

      if (conflicting) {
        setConflict({ id: conflicting.id, label: conflicting.label });
        return;
      }

      setConflict(null);
      updateSetting('customKeybindings', { ...customKeybindings, [recordingId]: binding });
      setRecordingId(null);
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [recordingId, sidebarOrder, customKeybindings, updateSetting]);

  const grouped = SHORTCUT_SECTIONS
    .map((section) => ({
      section,
      items: currentShortcuts.filter((s) => s.section === section),
      defaults: defaultShortcuts.filter((s) => s.section === section),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Keybindings</h2>
        <ConfirmPopover
          message="Reset all keybindings to defaults?"
          confirmLabel="Reset"
          onConfirm={() => resetSection('keybindings')}
        >
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
            <RotateCcw size={12} className="mr-1" />
            Reset All
          </Button>
        </ConfirmPopover>
      </div>

      <div className="space-y-5">
        {grouped.map(({ section, items }, gi) => (
          <div key={section}>
            {gi > 0 && <Separator className="mb-4" />}
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {section}
            </h3>
            <div className="space-y-1">
              {items.map((shortcut) => {
                const isRecording = recordingId === shortcut.id;
                const hasConflict = isRecording && conflict !== null;
                const custom = isCustomized(shortcut.id);
                const defaultBinding = getDefaultBinding(shortcut.id, sidebarOrder);

                return (
                  <div key={shortcut.id} className="space-y-1">
                    <div
                      className={cn(
                        'flex items-center justify-between gap-4 py-1.5 px-2 rounded-md transition-colors',
                        isRecording && 'bg-secondary/50'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">{shortcut.label}</p>
                        {custom && defaultBinding && (
                          <p className="text-[11px] text-muted-foreground">
                            Default: {getDisplayKey(defaultBinding)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isRecording ? (
                          <span className="text-xs text-primary animate-pulse font-medium px-2">
                            Press keys…
                          </span>
                        ) : (
                          <KbdGroup keys={getDisplayKey(shortcut)} />
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setRecordingId(shortcut.id);
                            setConflict(null);
                          }}
                        >
                          <Pencil size={12} />
                        </Button>

                        {custom && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => resetSingle(shortcut.id)}
                            title="Reset to default"
                          >
                            <Undo2 size={12} />
                          </Button>
                        )}
                      </div>
                    </div>

                    {hasConflict && conflict && (
                      <p className="text-xs text-destructive px-2">
                        Already assigned to &quot;{conflict.label}&quot;. Choose a different combination.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
