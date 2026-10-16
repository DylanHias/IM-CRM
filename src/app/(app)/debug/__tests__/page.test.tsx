import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DebugPage from '../page';

describe('Debug page', () => {
  it('opens on the console and switches between views', () => {
    render(<DebugPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Debug' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search logs…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy all/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sync Logs' }));
    expect(screen.getByLabelText('Search sync logs…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Force re-sync/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Revenue Cache' }));
    expect(screen.getByRole('button', { name: /Export to file/ })).toBeInTheDocument();
  });
});
