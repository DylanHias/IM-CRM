import type { SidebarTab } from '@/store/settingsStore';

type ShortcutSection = 'Navigation' | 'General' | 'Page Actions' | 'List Navigation' | 'Data';

interface ShortcutDefinition {
  id: string;
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  label: string;
  section: ShortcutSection;
  /** Only active on pages matching this prefix */
  when?: string;
}

const SHORTCUT_SECTIONS: ShortcutSection[] = [
  'Navigation',
  'General',
  'Page Actions',
  'List Navigation',
  'Data',
];

function buildNavigationShortcuts(sidebarOrder: SidebarTab[]): ShortcutDefinition[] {
  const labelMap: Record<SidebarTab, string> = {
    '/customers': 'Go to Customers',
    '/sync': 'Go to Sync',
    '/followups': 'Go to Follow-Ups',
    '/opportunities': 'Go to Opportunities',
    '/invoices': 'Go to Invoices',
    '/arr-overview': 'Go to ARR Overview',
  };

  return sidebarOrder.map((tab, i) => ({
    id: `nav-${i + 1}`,
    key: String(i + 1),
    label: labelMap[tab],
    section: 'Navigation' as const,
  }));
}

const STATIC_SHORTCUTS: ShortcutDefinition[] = [
  // Navigation (non-numbered)
  { id: 'nav-settings', key: 's', label: 'Open Settings', section: 'Navigation' },
  { id: 'nav-sidebar', key: 'b', label: 'Toggle Sidebar', section: 'Navigation' },

  // General
  { id: 'command-palette', key: 'k', ctrlKey: true, label: 'Command Palette', section: 'General' },
  { id: 'shortcuts-guide', key: '?', label: 'Keyboard Shortcuts', section: 'General' },
  { id: 'close', key: 'Escape', label: 'Close Dialog', section: 'General' },

  // Page Actions
  { id: 'new-item', key: 'n', label: 'New Item', section: 'Page Actions' },
  { id: 'focus-search', key: '/', label: 'Focus Search', section: 'Page Actions' },
  { id: 'toggle-filters', key: 'f', label: 'Toggle Filters', section: 'Page Actions', when: '/customers' },

  // List Navigation
  { id: 'list-down', key: 'ArrowDown', label: 'Move Down', section: 'List Navigation', when: '/customers' },
  { id: 'list-up', key: 'ArrowUp', label: 'Move Up', section: 'List Navigation', when: '/customers' },
  { id: 'list-open', key: 'Enter', label: 'Open Selected', section: 'List Navigation', when: '/customers' },

  // Data
  { id: 'sync', key: 'r', ctrlKey: true, shiftKey: true, label: 'Trigger Sync', section: 'Data' },
];

function getAllShortcuts(sidebarOrder: SidebarTab[]): ShortcutDefinition[] {
  return [...buildNavigationShortcuts(sidebarOrder), ...STATIC_SHORTCUTS];
}

function getDisplayKey(shortcut: ShortcutDefinition): string {
  const parts: string[] = [];
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.shiftKey) parts.push('Shift');

  const keyMap: Record<string, string> = {
    ArrowDown: '↓',
    ArrowUp: '↑',
    Escape: 'Esc',
    Enter: '↵',
    '?': '?',
    '/': '/',
  };

  parts.push(keyMap[shortcut.key] ?? shortcut.key.toUpperCase());
  return parts.join('+');
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

export { SHORTCUT_SECTIONS, getAllShortcuts, getDisplayKey, isInputFocused, buildNavigationShortcuts, STATIC_SHORTCUTS };
export type { ShortcutDefinition, ShortcutSection };
