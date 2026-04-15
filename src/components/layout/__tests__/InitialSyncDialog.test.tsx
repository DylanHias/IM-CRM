import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { InitialSyncDialog } from '../InitialSyncDialog';
import { useSyncStore } from '@/store/syncStore';
import { useAuthStore } from '@/store/authStore';

// Stable reference so the useEffect([needsInitialSync, triggerSync]) dep doesn't
// change on every render and keep act() spinning indefinitely.
const mockTriggerSync = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

// Mock useSync to prevent actual sync calls
vi.mock('@/hooks/useSync', () => ({
  useSync: () => ({
    triggerSync: mockTriggerSync,
    isOnline: true,
    isSyncing: false,
    lastD365SyncAt: null,
    syncErrors: [],
    pendingActivityCount: 0,
    pendingFollowUpCount: 0,
  }),
}));

// Mock offlineUtils
vi.mock('@/lib/utils/offlineUtils', () => ({
  isTauriApp: () => true,
}));

// Mock db queries
vi.mock('@/lib/db/queries/sync', () => ({
  getAppSetting: vi.fn().mockResolvedValue(''),
}));

describe('InitialSyncDialog', () => {
  beforeEach(() => {
    useSyncStore.setState({
      isSyncing: false,
      lastD365SyncAt: null,
      syncErrors: [],
      recentRecords: [],
      pendingActivityCount: 0,
      pendingFollowUpCount: 0,
      initialSyncProgress: null,
    });
    useAuthStore.setState({
      account: { name: 'Dylan Behiels', username: 'dylan@test.com' } as any,
      isAuthenticated: true,
      isLoading: false,
      accessToken: 'token',
      isAdmin: false,
    });
  });

  it('renders nothing when lastD365SyncAt is set', () => {
    useSyncStore.setState({ lastD365SyncAt: '2026-04-01T00:00:00Z' });
    const { container } = render(<InitialSyncDialog />);
    expect(container.innerHTML).toBe('');
  });

  it('shows syncing state with progress', async () => {
    useSyncStore.setState({
      initialSyncProgress: { phase: 'Syncing customers...', processed: 50, total: 200 },
    });
    await act(async () => {
      render(<InitialSyncDialog />);
    });
    expect(screen.getByText('Setting up your workspace')).toBeInTheDocument();
    expect(screen.getByText('Syncing customers...')).toBeInTheDocument();
    expect(screen.getByText('50 / 200 records')).toBeInTheDocument();
  });

  it('shows progress bar at correct width', async () => {
    useSyncStore.setState({
      initialSyncProgress: { phase: 'Syncing contacts...', processed: 75, total: 100 },
    });
    await act(async () => {
      render(<InitialSyncDialog />);
    });
    const progressBar = screen.getByTestId('sync-progress-fill');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '75%' });
  });
});
