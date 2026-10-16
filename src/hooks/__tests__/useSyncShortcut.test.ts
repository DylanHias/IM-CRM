import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mirrors the real useSync: triggerSync is async and resolves when the sync ends.
const triggerSync = vi.fn<() => Promise<void>>();
vi.mock('@/hooks/useSync', () => ({
  useSync: () => ({ triggerSync }),
}));

import { useSyncShortcut } from '../useSyncShortcut';

beforeEach(() => {
  triggerSync.mockReset();
  triggerSync.mockResolvedValue(undefined);
});

describe('useSyncShortcut', () => {
  it('runs a sync when the sync shortcut fires', () => {
    renderHook(() => useSyncShortcut());
    window.dispatchEvent(new CustomEvent('shortcut:sync'));
    expect(triggerSync).toHaveBeenCalledTimes(1);
  });

  it('logs a failed sync instead of throwing', async () => {
    const error = new Error('offline');
    triggerSync.mockRejectedValue(error);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderHook(() => useSyncShortcut());
    window.dispatchEvent(new CustomEvent('shortcut:sync'));
    await waitFor(() => expect(consoleError).toHaveBeenCalledWith('[sync] shortcut sync failed:', error));
    consoleError.mockRestore();
  });

  it('stops listening after unmount', () => {
    const { unmount } = renderHook(() => useSyncShortcut());
    unmount();
    window.dispatchEvent(new CustomEvent('shortcut:sync'));
    expect(triggerSync).not.toHaveBeenCalled();
  });
});
