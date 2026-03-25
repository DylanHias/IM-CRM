import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isTauriApp, isOnline, onOnlineStatusChange } from '../offlineUtils';

describe('offlineUtils', () => {
  describe('isTauriApp', () => {
    const originalWindow = globalThis.window;

    afterEach(() => {
      // Clean up any __TAURI_INTERNALS__ we added
      if (typeof window !== 'undefined') {
        delete (window as Record<string, unknown>).__TAURI_INTERNALS__;
      }
    });

    it('returns true when __TAURI_INTERNALS__ is present', () => {
      (window as Record<string, unknown>).__TAURI_INTERNALS__ = {};
      expect(isTauriApp()).toBe(true);
    });

    it('returns false when __TAURI_INTERNALS__ is absent', () => {
      expect(isTauriApp()).toBe(false);
    });
  });

  describe('isOnline', () => {
    it('returns true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      expect(isOnline()).toBe(true);
    });

    it('returns false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      expect(isOnline()).toBe(false);
    });
  });

  describe('onOnlineStatusChange', () => {
    it('fires callback with true on online event', () => {
      const callback = vi.fn();
      onOnlineStatusChange(callback);
      window.dispatchEvent(new Event('online'));
      expect(callback).toHaveBeenCalledWith(true);
    });

    it('fires callback with false on offline event', () => {
      const callback = vi.fn();
      onOnlineStatusChange(callback);
      window.dispatchEvent(new Event('offline'));
      expect(callback).toHaveBeenCalledWith(false);
    });

    it('returns a cleanup function', () => {
      const callback = vi.fn();
      const cleanup = onOnlineStatusChange(callback);
      expect(typeof cleanup).toBe('function');
    });

    it('cleanup removes listeners', () => {
      const callback = vi.fn();
      const cleanup = onOnlineStatusChange(callback);
      cleanup();
      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('offline'));
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
