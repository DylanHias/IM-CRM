import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRouter } from 'next/navigation';
import { ReportsPage } from '../ReportsPage';

beforeEach(() => vi.mocked(useRouter().replace).mockClear());

describe('ReportsPage', () => {
  it('opens on Revenue with region, period, refresh and the customer table', () => {
    render(<ReportsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Reports' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Revenue' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('combobox', { name: 'Region' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '12M' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { level: 2, name: 'All customers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Export to Excel/ })).toBeInTheDocument();
  });

  it('switches tabs and keeps the tab in the address', () => {
    render(<ReportsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Pipeline' }));
    expect(useRouter().replace).toHaveBeenCalledWith('/revenue-overview?tab=pipeline');
    expect(screen.queryByRole('combobox', { name: 'Region' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/ })).toBeInTheDocument();
  });

  it('shows a period picker on My activity', () => {
    render(<ReportsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'My activity' }));
    expect(screen.getByText('Last 30 days')).toBeInTheDocument();
  });
});
