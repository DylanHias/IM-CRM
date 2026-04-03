import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActivityKanbanCard } from '../ActivityKanbanCard';
import type { Activity } from '@/types/entities';

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: crypto.randomUUID(),
    customerId: 'cust-1',
    contactId: null,
    type: 'call',
    subject: 'Test call',
    description: null,
    occurredAt: '2026-04-01T10:00:00Z',
    startTime: null,
    activityStatus: 'open',
    direction: 'outgoing',
    createdById: 'user-1',
    createdByName: 'Test User',
    syncStatus: 'synced',
    remoteId: null,
    source: 'local',
    createdAt: '2026-04-01T10:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
    ...overrides,
  };
}

const defaultProps = {
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe('ActivityKanbanCard', () => {
  it('renders contact name in the header row next to the type badge', () => {
    render(
      <ActivityKanbanCard
        activity={makeActivity()}
        contactName="Karim Elouch"
        {...defaultProps}
      />
    );

    const contactEl = screen.getByText('Karim Elouch');
    const header = contactEl.closest('[data-testid="activity-card-header"]');
    expect(header).not.toBeNull();
    expect(header).toHaveTextContent('Outgoing Call');
    expect(header).toHaveTextContent('Karim Elouch');
  });

  it('does not render contact section when no contact name provided', () => {
    render(
      <ActivityKanbanCard
        activity={makeActivity()}
        {...defaultProps}
      />
    );

    expect(screen.queryByText('·')).toBeNull();
  });

  it('renders contact name with activity-type color class', () => {
    const { container } = render(
      <ActivityKanbanCard
        activity={makeActivity({ type: 'meeting', direction: null })}
        contactName="Sophie Van Damme"
        {...defaultProps}
      />
    );

    const contactEl = screen.getByText('Sophie Van Damme');
    expect(contactEl.className).toContain('text-activity-meeting');
  });

  it('does not render contact as a Badge component', () => {
    const { container } = render(
      <ActivityKanbanCard
        activity={makeActivity()}
        contactName="Karim Elouch"
        {...defaultProps}
      />
    );

    const badges = container.querySelectorAll('[data-slot="badge"]');
    const contactBadge = Array.from(badges).find(b => b.textContent === 'Karim Elouch');
    expect(contactBadge).toBeUndefined();
  });
});
