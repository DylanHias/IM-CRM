import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

vi.mock('@/lib/utils/offlineUtils', () => ({
  isOnline: vi.fn(() => true),
  onOnlineStatusChange: vi.fn((cb: (online: boolean) => void) => {
    const onOnline = () => cb(true);
    const onOffline = () => cb(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }),
}));

describe('useOnlineStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial online status as true', () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it('updates state when online event fires', () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });

  it('updates state when offline event fires', () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);
  });

  it('cleans up listeners on unmount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOnlineStatus());

    const onlineCalls = addSpy.mock.calls.filter(([e]) => e === 'online');
    const offlineCalls = addSpy.mock.calls.filter(([e]) => e === 'offline');
    expect(onlineCalls.length).toBeGreaterThanOrEqual(1);
    expect(offlineCalls.length).toBeGreaterThanOrEqual(1);

    unmount();

    const removedOnline = removeSpy.mock.calls.filter(([e]) => e === 'online');
    const removedOffline = removeSpy.mock.calls.filter(([e]) => e === 'offline');
    expect(removedOnline.length).toBeGreaterThanOrEqual(1);
    expect(removedOffline.length).toBeGreaterThanOrEqual(1);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
