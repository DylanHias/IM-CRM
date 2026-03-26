'use client';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { KbdGroup } from '@/components/ui/kbd';
import { useUIStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getAllShortcuts, getDisplayKey, SHORTCUT_SECTIONS } from '@/lib/shortcuts/shortcuts';

export function ShortcutsGuide() {
  const open = useUIStore((s) => s.shortcutsGuideOpen);
  const setOpen = useUIStore((s) => s.setShortcutsGuideOpen);
  const sidebarOrder = useSettingsStore((s) => s.sidebarOrder);
  const customKeybindings = useSettingsStore((s) => s.customKeybindings);

  const shortcuts = getAllShortcuts(sidebarOrder, customKeybindings);

  const grouped = SHORTCUT_SECTIONS
    .map((section) => ({
      section,
      items: shortcuts.filter((s) => s.section === section),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {grouped.map(({ section, items }, gi) => (
            <div key={section}>
              {gi > 0 && <Separator className="mb-4" />}
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {section}
              </h3>
              <div className="space-y-1.5">
                {items.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between py-1 px-1"
                  >
                    <span className="text-sm">{shortcut.label}</span>
                    <KbdGroup keys={getDisplayKey(shortcut)} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
