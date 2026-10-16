import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import SettingsPage from '../page';
import { useSettingsStore } from '@/store/settingsStore';

// Section bodies have their own tests; here only the page shell matters.
vi.mock('@/components/settings/ProfileSettings', () => ({ ProfileSettings: () => <div>Profile card</div> }));
vi.mock('@/components/settings/GeneralSettings', () => ({ GeneralSettings: () => <div>General body</div> }));
vi.mock('@/components/settings/AppearanceSettings', () => ({ AppearanceSettings: () => <div>Appearance body</div> }));
vi.mock('@/components/settings/DataDefaultsSettings', () => ({ DataDefaultsSettings: () => <div>Data defaults body</div> }));
vi.mock('@/components/settings/NotificationSettings', () => ({ NotificationSettings: () => <div>Notifications body</div> }));
vi.mock('@/components/settings/SyncSettings', () => ({ SyncSettings: () => <div>Sync body</div> }));
vi.mock('@/components/settings/KeybindingsSettings', () => ({ KeybindingsSettings: () => <div>Keybindings body</div> }));

beforeEach(() => {
  useSettingsStore.setState({ theme: 'dark', density: 'compact' });
});

describe('Settings page', () => {
  it('shows the profile and a tile per section', () => {
    render(<SettingsPage />);
    expect(screen.getByText('Profile card')).toBeInTheDocument();
    for (const label of ['General', 'Appearance', 'Data & Defaults', 'Notifications', 'Sync', 'Keybindings']) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
    }
    expect(screen.getByText('Dark · compact')).toBeInTheDocument();
  });

  it('opens a section and goes back', () => {
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Sync/ }));
    expect(screen.getByText('Sync body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reset to defaults/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to settings' }));
    expect(screen.getByText('Profile card')).toBeInTheDocument();
  });

  it('resets only the open section after confirming', () => {
    const resetSection = vi.fn();
    useSettingsStore.setState({ resetSection });
    render(<SettingsPage />);
    fireEvent.click(screen.getByRole('button', { name: /Notifications/ }));
    fireEvent.click(screen.getByRole('button', { name: /Reset to defaults/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(resetSection).toHaveBeenCalledWith('notifications');
  });

  it('finds a setting and jumps to its section', () => {
    render(<SettingsPage />);
    fireEvent.change(screen.getByLabelText('Find a setting'), { target: { value: 'accent' } });
    expect(screen.getByText(/results? for/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Accent color/ }));
    expect(screen.getByText('Appearance body')).toBeInTheDocument();
  });

  it('says so when nothing matches', () => {
    render(<SettingsPage />);
    fireEvent.change(screen.getByLabelText('Find a setting'), { target: { value: 'zzzz' } });
    expect(screen.getByText('No settings found')).toBeInTheDocument();
  });
});
