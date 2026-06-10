import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSync } from '../useSync';
import { useSyncStore } from '@/store/syncStore';

describe('useSync', () => {
  beforeEach(() => {
    useSyncStore.setState({ isSyncing: false });
  });

  it('keeps triggerSync/triggerPushPending stable across isSyncing toggles (B7)', () => {
    const { result, rerender } = renderHook(() => useSync());
    const firstSync = result.current.triggerSync;
    const firstPush = result.current.triggerPushPending;

    act(() => {
      useSyncStore.setState({ isSyncing: true });
    });
    rerender();
    act(() => {
      useSyncStore.setState({ isSyncing: false });
    });
    rerender();

    expect(result.current.triggerSync).toBe(firstSync);
    expect(result.current.triggerPushPending).toBe(firstPush);
  });
});
