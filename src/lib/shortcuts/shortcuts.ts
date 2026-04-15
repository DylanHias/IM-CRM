import type { SidebarTab } from '@/store/settingsStore';

type ShortcutSection = 'Navigation' | 'General' | 'Page Actions' | 'List Navigation' | 'Data';

interface ShortcutDefinition {
  id: string;
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  label: string;
  section: ShortcutSection;
  /** Only active on pages matching this prefix */
  when?: string;
}

type CustomKeybinding = { key: string; ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean };

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
    '/revenue-overview': 'Go to Revenue Overview',
    '/analytics': 'Go to Analytics',
    '/timeline': 'Go to Timeline',
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
  { id: 'toggle-filters', key: 'f', label: 'Toggle Filters', section: 'Page Actions' },

  // List Navigation
  { id: 'list-down', key: 'ArrowDown', label: 'Move Down', section: 'List Navigation', when: '/customers' },
  { id: 'list-up', key: 'ArrowUp', label: 'Move Up', section: 'List Navigation', when: '/customers' },
  { id: 'list-open', key: 'Enter', label: 'Open Selected', section: 'List Navigation', when: '/customers' },

  // Data
  { id: 'sync', key: 'r', ctrlKey: true, shiftKey: true, label: 'Trigger Sync', section: 'Data' },
];

function getDefaultShortcuts(sidebarOrder: SidebarTab[]): ShortcutDefinition[] {
  return [...buildNavigationShortcuts(sidebarOrder), ...STATIC_SHORTCUTS];
}

function getAllShortcuts(
  sidebarOrder: SidebarTab[],
  customKeybindings?: Record<string, CustomKeybinding>
): ShortcutDefinition[] {
  const base = getDefaultShortcuts(sidebarOrder);
  if (!customKeybindings || Object.keys(customKeybindings).length === 0) return base;
  return base.map((s) => {
    const override = customKeybindings[s.id];
    if (!override) return s;
    return {
      ...s,
      key: override.key,
      ctrlKey: override.ctrlKey,
      shiftKey: override.shiftKey,
      altKey: override.altKey,
    };
  });
}

function getDefaultBinding(
  id: string,
  sidebarOrder: SidebarTab[]
): CustomKeybinding | undefined {
  const defaults = getDefaultShortcuts(sidebarOrder);
  const shortcut = defaults.find((s) => s.id === id);
  if (!shortcut) return undefined;
  return { key: shortcut.key, ctrlKey: shortcut.ctrlKey, shiftKey: shortcut.shiftKey, altKey: shortcut.altKey };
}

function normalizeBinding(b: CustomKeybinding): string {
  const parts: string[] = [];
  if (b.ctrlKey) parts.push('ctrl');
  if (b.shiftKey) parts.push('shift');
  if (b.altKey) parts.push('alt');
  parts.push(b.key.toLowerCase());
  return parts.join('+');
}

function findConflict(
  shortcuts: ShortcutDefinition[],
  candidateId: string,
  binding: CustomKeybinding
): ShortcutDefinition | null {
  const candidateNorm = normalizeBinding(binding);
  for (const s of shortcuts) {
    if (s.id === candidateId) continue;
    const sNorm = normalizeBinding({ key: s.key, ctrlKey: s.ctrlKey, shiftKey: s.shiftKey, altKey: s.altKey });
    if (sNorm === candidateNorm) return s;
  }
  return null;
}

function getDisplayKey(shortcut: ShortcutDefinition | CustomKeybinding): string {
  const parts: string[] = [];
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');

  const key = 'key' in shortcut ? shortcut.key : '';
  const keyMap: Record<string, string> = {
    ArrowDown: '↓',
    ArrowUp: '↑',
    Escape: 'Esc',
    Enter: '↵',
    '?': '?',
    '/': '/',
  };

  parts.push(keyMap[key] ?? key.toUpperCase());
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

export {
  SHORTCUT_SECTIONS,
  getAllShortcuts,
  getDefaultShortcuts,
  getDefaultBinding,
  getDisplayKey,
  isInputFocused,
  buildNavigationShortcuts,
  findConflict,
  normalizeBinding,
  STATIC_SHORTCUTS,
};
export type { ShortcutDefinition, ShortcutSection, CustomKeybinding };
