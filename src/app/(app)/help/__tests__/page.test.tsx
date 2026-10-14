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
});
