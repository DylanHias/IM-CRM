import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccountInfo } from '@azure/msal-browser';
import { useRouter } from 'next/navigation';
import { ProfileModal } from '../ProfileModal';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

const account = { name: 'Dylan Hias', username: 'dylan.hias@example.com', localAccountId: 'u1' } as AccountInfo;

beforeEach(() => {
  vi.mocked(useRouter().push).mockClear();
  useAuthStore.setState({
    account,
    isAdmin: false,
    profilePhoto: null,
    userProfile: { jobTitle: 'Cloud Sales Specialist' } as never,
  });
  useUIStore.setState({ shortcutsGuideOpen: false });
});

describe('ProfileModal', () => {
  it('shows name and email but not the job title', () => {
    render(<ProfileModal open onOpenChange={() => {}} />);
    expect(screen.getByText('Dylan Hias')).toBeInTheDocument();
    expect(screen.getByText('dylan.hias@example.com')).toBeInTheDocument();
    expect(screen.queryByText('Cloud Sales Specialist')).not.toBeInTheDocument();
  });

  it('offers Sync, Settings, Help, Debug and Shortcuts, but not Admin for regular users', () => {
    render(<ProfileModal open onOpenChange={() => {}} />);
    for (const label of ['Sync', 'Settings', 'Help', 'Debug', 'Shortcuts']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
    expect(screen.queryByRole('button', { name: 'Admin' })).not.toBeInTheDocument();
  });

  it('shows Admin for admins', () => {
    useAuthStore.setState({ isAdmin: true });
    render(<ProfileModal open onOpenChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Admin' })).toBeInTheDocument();
  });

  it('opens the Sync page and closes', () => {
    const onOpenChange = vi.fn();
    render(<ProfileModal open onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sync' }));
    expect(useRouter().push).toHaveBeenCalledWith('/sync');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('opens the shortcuts guide', () => {
    render(<ProfileModal open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Shortcuts' }));
    expect(useUIStore.getState().shortcutsGuideOpen).toBe(true);
  });
});
