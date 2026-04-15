'use client';

import { useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, RefreshCw, CheckSquare, BarChart2, FileText, Target, LineChart,
  Settings, Keyboard, Search, Plus, Filter, ChevronsLeft, HelpCircle, Clock, Building2, User, LayoutDashboard,
} from 'lucide-react';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from '@/components/ui/command';
import { KbdGroup } from '@/components/ui/kbd';
import { useUIStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useCustomerStore } from '@/store/customerStore';
import { getAllShortcuts, getDisplayKey, SHORTCUT_SECTIONS } from '@/lib/shortcuts/shortcuts';
import type { ShortcutDefinition } from '@/lib/shortcuts/shortcuts';
import type { LucideIcon } from 'lucide-react';
import type { SidebarTab } from '@/store/settingsStore';

const NAV_ICONS: Record<SidebarTab, LucideIcon> = {
  '/today': LayoutDashboard,
  '/customers': Users,
  '/sync': RefreshCw,
  '/followups': CheckSquare,
  '/opportunities': Target,
  '/invoices': FileText,
  '/revenue-overview': BarChart2,
  '/analytics': LineChart,
  '/timeline': Clock,
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
  const customers = useCustomerStore((s) => s.customers);
  const allContacts = useCustomerStore((s) => s.allContacts);
  const router = useRouter();

  const [query, setQuery] = useState('');

  const shortcuts = getAllShortcuts(sidebarOrder, customKeybindings);

  const handleSelect = useCallback(
    (shortcut: ShortcutDefinition) => {
      setOpen(false);
      setQuery('');

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

  const q = query.toLowerCase().trim();

  const matchedCustomers = useMemo(() => {
    if (!q) return [];
    return customers
      .filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.accountNumber?.toLowerCase().includes(q) ||
        c.addressCity?.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [customers, q]);

  const matchedContacts = useMemo(() => {
    if (!q) return [];
    return allContacts
      .filter((c) => {
        const full = `${c.firstName} ${c.lastName}`.toLowerCase();
        return full.includes(q) || c.email?.toLowerCase().includes(q) || c.jobTitle?.toLowerCase().includes(q);
      })
      .slice(0, 5);
  }, [allContacts, q]);

  const paletteShortcuts = shortcuts.filter(
    (s) => s.id !== 'command-palette' && s.id !== 'close' && s.section !== 'List Navigation'
  );

  const grouped = SHORTCUT_SECTIONS
    .map((section) => ({
      section,
      items: paletteShortcuts.filter((s) => s.section === section),
    }))
    .filter((g) => g.items.length > 0);

  const hasSearchResults = matchedCustomers.length > 0 || matchedContacts.length > 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQuery('');
      }}
    >
      <CommandInput
        placeholder="Search customers, contacts, or type a command…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {matchedCustomers.length > 0 && (
          <CommandGroup heading="Customers">
            {matchedCustomers.map((c) => (
              <CommandItem
                key={`customer-${c.id}`}
                value={`customer-${c.id}-${c.name}`}
                onSelect={() => {
                  setOpen(false);
                  setQuery('');
                  router.push(`/customers?id=${c.id}`);
                }}
              >
                <Building2 className="mr-2 h-4 w-4 opacity-60" />
                <span className="flex-1">{c.name}</span>
                {c.addressCity && (
                  <span className="text-xs text-muted-foreground ml-2">{c.addressCity}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchedContacts.length > 0 && (
          <CommandGroup heading="Contacts">
            {matchedContacts.map((c) => {
              const customerName = customers.find((cu) => cu.id === c.customerId)?.name;
              return (
                <CommandItem
                  key={`contact-${c.id}`}
                  value={`contact-${c.id}-${c.firstName}-${c.lastName}`}
                  onSelect={() => {
                    setOpen(false);
                    setQuery('');
                    router.push(`/customers?id=${c.customerId}&tab=contacts`);
                  }}
                >
                  <User className="mr-2 h-4 w-4 opacity-60" />
                  <span className="flex-1">{c.firstName} {c.lastName}</span>
                  {customerName && (
                    <span className="text-xs text-muted-foreground ml-2">{customerName}</span>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {!hasSearchResults && grouped.map(({ section, items }) => (
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

        {!hasSearchResults && (
          <CommandGroup heading="Other">
            <CommandItem
              value="Help"
              onSelect={() => {
                setOpen(false);
                setQuery('');
                router.push('/help');
              }}
            >
              <HelpCircle className="mr-2 h-4 w-4 opacity-60" />
              <span className="flex-1">Help</span>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
