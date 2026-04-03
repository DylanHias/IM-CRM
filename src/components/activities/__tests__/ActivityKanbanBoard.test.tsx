import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityKanbanBoard } from '../ActivityKanbanBoard';
import type { Activity, Contact } from '@/types/entities';

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: crypto.randomUUID(),
    customerId: 'cust-1',
    contactId: null,
    type: 'note',
    subject: 'Test activity',
    description: null,
    occurredAt: '2026-04-01T10:00:00Z',
    startTime: null,
    activityStatus: 'open',
    direction: null,
    createdById: 'user-1',
    createdByName: 'Test User',
    syncStatus: 'pending',
    remoteId: null,
    source: 'local',
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
    ...overrides,
  };
}

const defaultProps = {
  contacts: [] as Contact[],
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onStatusChange: vi.fn(),
};

function getColumnByStatus(container: HTMLElement, status: string): HTMLElement {
  const section = container.querySelector(`[aria-labelledby="column-${status}-title"]`);
  if (!section) throw new Error(`Column for status "${status}" not found`);
  return section as HTMLElement;
}

describe('ActivityKanbanBoard', () => {
  it('collapses empty columns and keeps non-empty columns expanded', () => {
    const activities = [makeActivity({ activityStatus: 'open' })];

    const { container } = render(<ActivityKanbanBoard activities={activities} {...defaultProps} />);

    const openColumn = getColumnByStatus(container, 'open');
    expect(openColumn.className).not.toContain('w-10');

    const completedColumn = getColumnByStatus(container, 'completed');
    expect(completedColumn.className).toContain('w-10');

    const rejectedColumn = getColumnByStatus(container, 'rejected');
    expect(rejectedColumn.className).toContain('w-10');

    const expiredColumn = getColumnByStatus(container, 'expired');
    expect(expiredColumn.className).toContain('w-10');
  });

  it('expands a collapsed column when clicked', () => {
    const activities = [makeActivity({ activityStatus: 'open' })];

    const { container } = render(<ActivityKanbanBoard activities={activities} {...defaultProps} />);

    const completedColumn = getColumnByStatus(container, 'completed');
    expect(completedColumn.className).toContain('w-10');

    fireEvent.click(completedColumn);

    const expandedColumn = getColumnByStatus(container, 'completed');
    expect(expandedColumn.className).not.toContain('w-10');
  });
});
