import { describe, it, expect } from 'vitest';
import {
  getAllShortcuts,
  getDisplayKey,
  isInputFocused,
  SHORTCUT_SECTIONS,
} from '../shortcuts';
import type { ShortcutDefinition } from '../shortcuts';
import { DEFAULT_SIDEBAR_ORDER } from '@/store/settingsStore';

describe('shortcuts', () => {
  describe('getAllShortcuts', () => {
    it('returns navigation shortcuts matching sidebar order length', () => {
      const all = getAllShortcuts(DEFAULT_SIDEBAR_ORDER);
      const navNumbered = all.filter(
        (s) => s.id.startsWith('nav-') && !isNaN(Number(s.id.split('-')[1]))
      );
      expect(navNumbered).toHaveLength(DEFAULT_SIDEBAR_ORDER.length);
    });

    it('includes all static shortcuts', () => {
      const all = getAllShortcuts(DEFAULT_SIDEBAR_ORDER);
      const ids = all.map((s) => s.id);
      expect(ids).toContain('command-palette');
      expect(ids).toContain('shortcuts-guide');
      expect(ids).toContain('new-item');
      expect(ids).toContain('focus-search');
      expect(ids).toContain('sync');
      expect(ids).toContain('nav-settings');
      expect(ids).toContain('nav-sidebar');
    });

    it('navigation keys are 1 through N', () => {
      const all = getAllShortcuts(DEFAULT_SIDEBAR_ORDER);
      DEFAULT_SIDEBAR_ORDER.forEach((_, i) => {
        const shortcut = all.find((s) => s.id === `nav-${i + 1}`);
        expect(shortcut).toBeDefined();
        expect(shortcut!.key).toBe(String(i + 1));
      });
    });

    it('respects custom sidebar order', () => {
      const custom = ['/invoices', '/customers'] as typeof DEFAULT_SIDEBAR_ORDER;
      const all = getAllShortcuts(custom);
      const nav1 = all.find((s) => s.id === 'nav-1');
      expect(nav1!.label).toBe('Go to Invoices');
    });
  });

  describe('getDisplayKey', () => {
    it('formats simple key', () => {
      const s: ShortcutDefinition = { id: 'test', key: 'n', label: 'Test', section: 'General' };
      expect(getDisplayKey(s)).toBe('N');
    });

    it('formats Ctrl combo', () => {
      const s: ShortcutDefinition = { id: 'test', key: 'k', ctrlKey: true, label: 'Test', section: 'General' };
      expect(getDisplayKey(s)).toBe('Ctrl+K');
    });

    it('formats Ctrl+Shift combo', () => {
      const s: ShortcutDefinition = { id: 'test', key: 'r', ctrlKey: true, shiftKey: true, label: 'Test', section: 'General' };
      expect(getDisplayKey(s)).toBe('Ctrl+Shift+R');
    });

    it('maps special keys', () => {
      expect(getDisplayKey({ id: 't', key: 'ArrowDown', label: '', section: 'General' })).toBe('↓');
      expect(getDisplayKey({ id: 't', key: 'ArrowUp', label: '', section: 'General' })).toBe('↑');
      expect(getDisplayKey({ id: 't', key: 'Escape', label: '', section: 'General' })).toBe('Esc');
      expect(getDisplayKey({ id: 't', key: 'Enter', label: '', section: 'General' })).toBe('↵');
    });
  });

  describe('isInputFocused', () => {
    it('returns false when no element is focused', () => {
      expect(isInputFocused()).toBe(false);
    });

    it('returns true when input is focused', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      expect(isInputFocused()).toBe(true);
      document.body.removeChild(input);
    });

    it('returns true when textarea is focused', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();
      expect(isInputFocused()).toBe(true);
      document.body.removeChild(textarea);
    });

    it('returns false when a regular div is focused', () => {
      const div = document.createElement('div');
      div.tabIndex = 0;
      document.body.appendChild(div);
      div.focus();
      expect(isInputFocused()).toBe(false);
      document.body.removeChild(div);
    });
  });

  describe('SHORTCUT_SECTIONS', () => {
    it('every shortcut belongs to a valid section', () => {
      const all = getAllShortcuts(DEFAULT_SIDEBAR_ORDER);
      for (const s of all) {
        expect(SHORTCUT_SECTIONS).toContain(s.section);
      }
    });
  });
});
