'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getAllShortcuts, isInputFocused } from '@/lib/shortcuts/shortcuts';
import type { ShortcutDefinition } from '@/lib/shortcuts/shortcuts';

/**
 * Global keyboard shortcut listener — mounted once in AppShell.
 * Dispatches `shortcut:{id}` CustomEvents on `window` for page-specific actions.
 */
export function useShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const sidebarOrder = useSettingsStore((s) => s.sidebarOrder);
  const customKeybindings = useSettingsStore((s) => s.customKeybindings);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const handleShortcut = useCallback(
    (shortcut: ShortcutDefinition) => {
      // Navigation shortcuts (1–6)
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
        case 'command-palette':
          useUIStore.getState().setCommandPaletteOpen(true);
          break;
        case 'shortcuts-guide':
          useUIStore.getState().setShortcutsGuideOpen(true);
          break;
        case 'sync':
          router.push('/sync');
          window.dispatchEvent(new CustomEvent('shortcut:sync'));
          break;
        default:
          // Page-specific: dispatch custom event for the page to handle
          window.dispatchEvent(new CustomEvent(`shortcut:${shortcut.id}`));
          break;
      }
    },
    [router, sidebarOrder, toggleSidebar]
  );

  useEffect(() => {
    const shortcuts = getAllShortcuts(sidebarOrder, customKeybindings);

    const handler = (e: KeyboardEvent) => {
      // Don't intercept when a modifier-less shortcut fires inside an input
      const hasModifier = e.ctrlKey || e.metaKey || e.altKey;

      for (const shortcut of shortcuts) {
        const wantsCtrl = shortcut.ctrlKey ?? false;
        const wantsShift = shortcut.shiftKey ?? false;
        const wantsAlt = shortcut.altKey ?? false;

        // Match modifiers
        if (wantsCtrl !== (e.ctrlKey || e.metaKey)) continue;
        if (wantsShift !== e.shiftKey) continue;
        if (wantsAlt !== e.altKey) continue;

        // Match key (case-insensitive for letters)
        const pressedKey = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        const shortcutKey = shortcut.key.length === 1 ? shortcut.key.toLowerCase() : shortcut.key;
        if (pressedKey !== shortcutKey) continue;

        // Skip single-key shortcuts when typing in an input
        if (!hasModifier && isInputFocused()) continue;

        // Context check
        if (shortcut.when && !pathname.startsWith(shortcut.when)) continue;

        e.preventDefault();
        handleShortcut(shortcut);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sidebarOrder, customKeybindings, pathname, handleShortcut]);
}

/**
 * Subscribe to a page-specific shortcut event.
 * Usage: useShortcutListener('new-item', () => setDialogOpen(true));
 */
export function useShortcutListener(shortcutId: string, callback: () => void) {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener(`shortcut:${shortcutId}`, handler);
    return () => window.removeEventListener(`shortcut:${shortcutId}`, handler);
  }, [shortcutId, callback]);
}
