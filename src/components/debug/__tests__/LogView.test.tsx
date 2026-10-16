import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Terminal } from 'lucide-react';
import { LogView, type LogRow } from '../LogView';

const ROWS: LogRow[] = [
  { id: 1, time: '10:00:01', level: 'err', levelLabel: 'ERROR', source: 'sync', message: 'Token expired', detail: 'Sign in again' },
  { id: 2, time: '10:00:02', level: 'warn', levelLabel: 'WARN', source: 'db', message: 'Slow query' },
  { id: 3, time: '10:00:03', level: 'info', levelLabel: 'INFO', source: 'sync', message: 'Pulled 12 customers' },
];

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'err', label: 'Errors', level: 'err' as const },
  { value: 'warn', label: 'Warnings', level: 'warn' as const },
];

const renderView = () =>
  render(
    <LogView
      title="Debug"
      rows={ROWS}
      filters={FILTERS}
      filterLabel="Level"
      searchPlaceholder="Search logs…"
      empty={{ icon: Terminal, title: 'No log entries', description: 'Nothing matches this search or level.' }}
    />,
  );

describe('LogView', () => {
  it('lists every row with a count per level', () => {
    renderView();
    expect(screen.getAllByRole('row')).toHaveLength(ROWS.length + 1);
    const filters = screen.getByRole('group', { name: 'Level' });
    expect(within(filters).getByRole('button', { name: /Errors 1/ })).toBeInTheDocument();
    expect(screen.getByText('3 of 3 entries')).toBeInTheDocument();
  });

  it('narrows by level and by search', () => {
    renderView();
    fireEvent.click(screen.getByRole('button', { name: /Warnings/ }));
    expect(screen.getAllByRole('row')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /^All/ }));
    fireEvent.change(screen.getByLabelText('Search logs…'), { target: { value: 'pulled' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('1 of 3 entries')).toBeInTheDocument();
  });

  it('shows the selected entry in full below the table', () => {
    renderView();
    const detail = screen.getByRole('region', { name: 'Selected entry' });
    expect(within(detail).getByText(/Token expired/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('row', { name: /Slow query/ }));
    expect(within(detail).getByText(/Slow query/)).toBeInTheDocument();
  });

  it('copies the selected entry', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderView();
    fireEvent.click(within(screen.getByRole('region', { name: 'Selected entry' })).getByRole('button', { name: /Copy/ }));
    expect(writeText).toHaveBeenCalledWith('10:00:01 ERROR [sync] Token expired\nSign in again');
  });

  it('shows the empty state when nothing matches', () => {
    renderView();
    fireEvent.change(screen.getByLabelText('Search logs…'), { target: { value: 'zzz' } });
    expect(screen.getByText('No log entries')).toBeInTheDocument();
  });
});
