import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportsShell } from '../ReportsShell';

describe('ReportsShell', () => {
  it('renders the four tabs', () => {
    render(<ReportsShell />);
    for (const t of ['Growth', 'Pipeline', 'Accounts', 'Activity']) {
      expect(screen.getByRole('button', { name: t })).toBeInTheDocument();
    }
  });

  it('shows the country filter only under Team scope', () => {
    render(<ReportsShell />);
    expect(screen.queryByRole('group', { name: 'Country' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Team' }));
    const country = screen.getByRole('group', { name: 'Country' });
    expect(country).toBeInTheDocument();
    for (const c of ['All Benelux', 'BE', 'NL', 'LU']) expect(screen.getByRole('button', { name: c })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mine' }));
    expect(screen.queryByRole('group', { name: 'Country' })).not.toBeInTheDocument();
  });

  it('offers no period beyond 12 months', () => {
    render(<ReportsShell />);
    const options = Array.from(screen.getByRole('combobox', { name: 'Period' }).querySelectorAll('option')).map((o) => o.textContent);
    expect(options).toEqual(expect.arrayContaining(['Last 3 months', 'Last 6 months', 'Last 12 months']));
    expect(options.join(' ')).not.toMatch(/18|24/);
  });

  it('switches tabs and shows each tab as a named placeholder', () => {
    render(<ReportsShell />);
    expect(screen.getByText('Growth lands next')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Activity' }));
    expect(screen.getByText('Activity lands next')).toBeInTheDocument();
  });
});
