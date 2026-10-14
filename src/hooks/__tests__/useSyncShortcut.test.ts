import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const triggerSync = vi.fn();
vi.mock('@/hooks/useSync', () => ({
  useSync: () => ({ triggerSync }),
}));

import { useSyncShortcut } from '../useSyncShortcut';

describe('useSyncShortcut', () => {
  it('runs a sync when the sync shortcut fires', () => {
    renderHook(() => useSyncShortcut());
    window.dispatchEvent(new CustomEvent('shortcut:sync'));
    expect(triggerSync).toHaveBeenCalledTimes(1);
  });

  it('stops listening after unmount', () => {
    triggerSync.mockClear();
    const { unmount } = renderHook(() => useSyncShortcut());
    unmount();
    window.dispatchEvent(new CustomEvent('shortcut:sync'));
    expect(triggerSync).not.toHaveBeenCalled();
  });
});
