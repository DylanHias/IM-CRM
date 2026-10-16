import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRouter } from 'next/navigation';
import { availablePeriods, periodLabel } from '@/lib/reports/period';
import { ReportsShell } from '../ReportsShell';

let search = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(search),
}));
const replaceMock = vi.hoisted(() => vi.fn());

beforeEach(() => {
  search = '';
  replaceMock.mockClear();
});

describe('ReportsShell', () => {
  it('renders the four tabs with tab semantics', () => {
    render(<ReportsShell />);
    expect(screen.getByRole('tablist', { name: 'Report' })).toBeInTheDocument();
    for (const t of ['Growth', 'Pipeline', 'Accounts', 'Activity']) {
      expect(screen.getByRole('tab', { name: t })).toBeInTheDocument();
    }
    expect(screen.getByRole('tab', { name: 'Growth' })).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel');
    expect(screen.getByRole('tab', { name: 'Growth' })).toHaveAttribute('aria-controls', panel.id);
  });

  it('shows the country filter only under Team scope', () => {
    render(<ReportsShell />);
    expect(screen.queryByRole('group', { name: 'Country' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Team' }));
    expect(screen.getByRole('group', { name: 'Country' })).toBeInTheDocument();
    for (const c of ['All Benelux', 'BE', 'NL', 'LU']) expect(screen.getByRole('button', { name: c })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mine' }));
    expect(screen.queryByRole('group', { name: 'Country' })).not.toBeInTheDocument();
  });

  it('forgets the chosen country when switching back to Mine', () => {
    render(<ReportsShell />);
    fireEvent.click(screen.getByRole('button', { name: 'Team' }));
    fireEvent.click(screen.getByRole('button', { name: 'NL' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mine' }));
    fireEvent.click(screen.getByRole('button', { name: 'Team' }));
    expect(screen.getByRole('button', { name: 'All Benelux' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('offers exactly the periods availablePeriods() allows, none beyond 12 months', () => {
    render(<ReportsShell />);
    const options = Array.from(screen.getByRole('combobox', { name: 'Period' }).querySelectorAll('option')).map((o) => o.textContent);
    expect(options).toEqual(availablePeriods().map(periodLabel));
    expect(options.slice(0, 3)).toEqual(['Last 3 months', 'Last 6 months', 'Last 12 months']);
  });

  it('switches tabs, shows the named placeholder and writes the tab to the address', () => {
    render(<ReportsShell />);
    expect(screen.getByText('Growth lands next')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
    expect(screen.getByText('Activity lands next')).toBeInTheDocument();
    expect(useRouter().replace).toHaveBeenCalledWith('/revenue-overview?tab=activity');
  });

  it('opens on the tab named in the address', () => {
    search = 'tab=pipeline';
    render(<ReportsShell />);
    expect(screen.getByText('Pipeline lands next')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Pipeline' })).toHaveAttribute('aria-selected', 'true');
  });

  it('falls back to Growth for an unknown tab', () => {
    search = 'tab=bogus';
    render(<ReportsShell />);
    expect(screen.getByText('Growth lands next')).toBeInTheDocument();
  });
});
