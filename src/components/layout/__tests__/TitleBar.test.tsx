import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useRouter } from 'next/navigation';
import { TitleBar } from '../TitleBar';
import { useSyncStore } from '@/store/syncStore';
import { useUIStore } from '@/store/uiStore';

beforeEach(() => {
  useSyncStore.setState({ isSyncing: false, pendingActivityCount: 0, pendingFollowUpCount: 0, pendingOpportunityCount: 0 });
  useUIStore.setState({ commandPaletteOpen: false });
});

afterEach(() => {
  useSyncStore.setState({ isSyncing: false, pendingActivityCount: 0, pendingFollowUpCount: 0, pendingOpportunityCount: 0 });
});

describe('TitleBar', () => {
  it('shows the app name and the online pill', () => {
    render(<TitleBar />);
    expect(screen.getByText('Ingram Micro CRM')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('hides the pending pill when nothing is waiting to sync', () => {
    render(<TitleBar />);
    expect(screen.queryByText(/pending/)).not.toBeInTheDocument();
  });

  it('shows how many changes are waiting and opens Sync on click', () => {
    useSyncStore.setState({ pendingActivityCount: 2, pendingFollowUpCount: 1, pendingOpportunityCount: 1 });
    render(<TitleBar />);
    const pill = screen.getByRole('button', { name: /4 pending/ });
    fireEvent.click(pill);
    expect(useRouter().push).toHaveBeenCalledWith('/sync');
  });

  it('shows a syncing state while a sync runs', () => {
    useSyncStore.setState({ isSyncing: true, pendingActivityCount: 2 });
    render(<TitleBar />);
    expect(screen.getByText('Syncing…')).toBeInTheDocument();
    expect(screen.queryByText(/pending/)).not.toBeInTheDocument();
  });

  it('opens the command palette from the search button', () => {
    render(<TitleBar />);
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
  });
});
