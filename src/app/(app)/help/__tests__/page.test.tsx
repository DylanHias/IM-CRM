import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HelpPage from '../page';

describe('Help page', () => {
  it('opens on Getting Started and switches topics', async () => {
    render(<HelpPage />);
    const topics = screen.getByRole('navigation', { name: 'Help topics' });
    expect(topics).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Getting Started' })).toHaveAttribute('aria-current', 'page');

    fireEvent.click(screen.getByRole('button', { name: 'Sync' }));
    expect(screen.getByRole('button', { name: 'Sync' })).toHaveAttribute('aria-current', 'page');
    expect(await screen.findByRole('heading', { level: 1, name: 'Sync' })).toBeInTheDocument();
  });

  it('documents the four Reports tabs and drops the stale Report tabs topic', async () => {
    render(<HelpPage />);
    expect(screen.queryByRole('button', { name: 'Report tabs' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reports' }));
    for (const tab of ['Growth', 'Pipeline', 'Accounts', 'Activity']) {
      expect(await screen.findByRole('heading', { level: 2, name: tab })).toBeInTheDocument();
    }
    expect(screen.getByText(/whose figures you are looking at/i)).toBeInTheDocument();
    expect(screen.getByText(/Nothing goes back further than 12 months/i)).toBeInTheDocument();
    expect(screen.getByText(/Stage conversion and deal velocity are not shown/i)).toBeInTheDocument();
    expect(screen.getByText(/every account in Benelux, not only the ones your team owns/i)).toBeInTheDocument();
    expect(screen.getByText(/Win rate is by value/i)).toBeInTheDocument();
  });
});
