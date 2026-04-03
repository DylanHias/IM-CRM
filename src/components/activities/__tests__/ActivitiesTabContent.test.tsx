import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivitiesTabContent } from '../ActivitiesTabContent';
import { createActivity } from '@/__tests__/mocks/factories';

vi.mock('../ActivityKanbanBoard', () => ({
  ActivityKanbanBoard: ({ activities }: { activities: unknown[] }) => (
    <div data-testid="kanban-board" data-count={activities.length}>
      {activities.map((a) => {
        const act = a as { id: string; subject: string };
        return <div key={act.id}>{act.subject}</div>;
      })}
    </div>
  ),
}));

vi.mock('../NotesTable', () => ({
  NotesTable: () => <div data-testid="notes-table" />,
}));

vi.mock('../ActivityDateFilter', () => ({
  ActivityDateFilter: ({ onChange }: { onChange: (range: { from: string; to: string } | null) => void }) => (
    <div data-testid="date-filter">
      <button onClick={() => onChange(null)}>All time</button>
      <button
        onClick={() =>
          onChange({ from: '2026-01-01T00:00:00.000Z', to: '2026-04-03T23:59:59.999Z' })
        }
      >
        Last 3 months
      </button>
    </div>
  ),
}));

const baseProps = {
  contacts: [],
  onAddActivity: vi.fn(),
  onEditActivity: vi.fn(),
  onDeleteActivity: vi.fn(),
  onStatusChange: vi.fn(),
};

describe('ActivitiesTabContent', () => {
  it('renders the date filter', () => {
    render(<ActivitiesTabContent {...baseProps} activities={[]} />);
    expect(screen.getByTestId('date-filter')).toBeInTheDocument();
  });

  it('filters activities outside the selected date range', async () => {
    const activities = [
      createActivity({ id: '1', subject: 'Recent call', type: 'call', occurredAt: '2026-03-15T10:00:00.000Z' }),
      createActivity({ id: '2', subject: 'Old visit', type: 'visit', occurredAt: '2025-06-01T10:00:00.000Z' }),
      createActivity({ id: '3', subject: 'Recent meeting', type: 'meeting', occurredAt: '2026-02-10T10:00:00.000Z' }),
    ];

    render(<ActivitiesTabContent {...baseProps} activities={activities} />);

    // Click "Last 3 months" to set the range
    screen.getByText('Last 3 months').click();

    await waitFor(() => {
      expect(screen.getByTestId('kanban-board')).toHaveAttribute('data-count', '2');
    });
    expect(screen.getByText('Recent call')).toBeInTheDocument();
    expect(screen.getByText('Recent meeting')).toBeInTheDocument();
    expect(screen.queryByText('Old visit')).not.toBeInTheDocument();
  });

  it('shows all activities when "All time" is selected', () => {
    const activities = [
      createActivity({ id: '1', subject: 'Recent call', type: 'call', occurredAt: '2026-03-15T10:00:00.000Z' }),
      createActivity({ id: '2', subject: 'Old visit', type: 'visit', occurredAt: '2025-06-01T10:00:00.000Z' }),
    ];

    render(<ActivitiesTabContent {...baseProps} activities={activities} />);

    // Click "All time" to remove filtering
    screen.getByText('All time').click();

    const board = screen.getByTestId('kanban-board');
    expect(board).toHaveAttribute('data-count', '2');
    expect(screen.getByText('Recent call')).toBeInTheDocument();
    expect(screen.getByText('Old visit')).toBeInTheDocument();
  });
});
