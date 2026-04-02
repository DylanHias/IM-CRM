'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, RefreshCw, CheckSquare, BarChart2, FileText, Target,
  Settings, Keyboard, Search, Plus, Filter, ChevronsLeft, HelpCircle,
} from 'lucide-react';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from '@/components/ui/command';
import { KbdGroup } from '@/components/ui/kbd';
import { useUIStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getAllShortcuts, getDisplayKey, SHORTCUT_SECTIONS } from '@/lib/shortcuts/shortcuts';
import type { ShortcutDefinition } from '@/lib/shortcuts/shortcuts';
import type { LucideIcon } from 'lucide-react';
import type { SidebarTab } from '@/store/settingsStore';

const NAV_ICONS: Record<SidebarTab, LucideIcon> = {
  '/customers': Users,
  '/sync': RefreshCw,
  '/followups': CheckSquare,
  '/opportunities': Target,
  '/invoices': FileText,
  '/arr-overview': BarChart2,
};

const ACTION_ICONS: Record<string, LucideIcon> = {
  'nav-settings': Settings,
  'nav-sidebar': ChevronsLeft,
  'command-palette': Search,
  'shortcuts-guide': Keyboard,
  'new-item': Plus,
  'focus-search': Search,
  'toggle-filters': Filter,
  sync: RefreshCw,
};

function getIcon(shortcut: ShortcutDefinition, sidebarOrder: SidebarTab[]): LucideIcon | undefined {
  if (shortcut.id.startsWith('nav-') && !isNaN(Number(shortcut.id.split('-')[1]))) {
    const idx = Number(shortcut.id.split('-')[1]) - 1;
    const tab = sidebarOrder[idx];
    if (tab) return NAV_ICONS[tab];
  }
  return ACTION_ICONS[shortcut.id];
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const sidebarOrder = useSettingsStore((s) => s.sidebarOrder);
  const customKeybindings = useSettingsStore((s) => s.customKeybindings);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const router = useRouter();

  const shortcuts = getAllShortcuts(sidebarOrder, customKeybindings);

  const handleSelect = useCallback(
    (shortcut: ShortcutDefinition) => {
      setOpen(false);

      if (shortcut.id.startsWith('nav-') && !isNaN(Number(shortcut.id.split('-')[1]))) {
        const idx = Number(shortcut.id.split('-')[1]) - 1;
        const tab = sidebarOrder[idx];
        if (tab) router.push(tab);
        return;
      }

      switch (shortcut.id) {
        case 'nav-settings':
          router.push('/settings');
          break;
        case 'nav-sidebar':
          toggleSidebar();
          break;
        case 'shortcuts-guide':
          useUIStore.getState().setShortcutsGuideOpen(true);
          break;
        case 'sync':
          router.push('/sync');
          window.dispatchEvent(new CustomEvent('shortcut:sync'));
          break;
        default:
          window.dispatchEvent(new CustomEvent(`shortcut:${shortcut.id}`));
          break;
      }
    },
    [router, sidebarOrder, setOpen, toggleSidebar]
  );

  // Group shortcuts by section, skip sections that are purely contextual or have no palette value
  const paletteShortcuts = shortcuts.filter(
    (s) => s.id !== 'command-palette' && s.id !== 'close' && s.section !== 'List Navigation'
  );

  const grouped = SHORTCUT_SECTIONS
    .map((section) => ({
      section,
      items: paletteShortcuts.filter((s) => s.section === section),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {grouped.map(({ section, items }) => (
          <CommandGroup key={section} heading={section}>
            {items.map((shortcut) => {
              const Icon = getIcon(shortcut, sidebarOrder);
              return (
                <CommandItem
                  key={shortcut.id}
                  value={shortcut.label}
                  onSelect={() => handleSelect(shortcut)}
                >
                  {Icon && <Icon className="mr-2 h-4 w-4 opacity-60" />}
                  <span className="flex-1">{shortcut.label}</span>
                  <KbdGroup keys={getDisplayKey(shortcut)} className="ml-auto" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
        <CommandGroup heading="Other">
          <CommandItem
            value="Help"
            onSelect={() => {
              setOpen(false);
              router.push('/help');
            }}
          >
            <HelpCircle className="mr-2 h-4 w-4 opacity-60" />
            <span className="flex-1">Help</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
