import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useRef, type ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { KanbanBoardContext } from '@/components/kanban';
import { ActivityKanbanCard } from '../ActivityKanbanCard';
import type { Activity } from '@/types/entities';

function DndWrapper({ children }: { children: ReactNode }) {
  const activeIdRef = useRef('');
  return (
    <TooltipProvider>
      <KanbanBoardContext.Provider
        value={{
          activeIdRef,
          draggableDescribedById: 'test-dnd',
          registerMonitor: vi.fn(),
          unregisterMonitor: vi.fn(),
          triggerEvent: vi.fn(),
        }}
      >
        {children}
      </KanbanBoardContext.Provider>
    </TooltipProvider>
  );
}

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
      />,
      { wrapper: DndWrapper },
    );

    const contactEl = screen.getByText('Karim Elouch');
    const header = contactEl.closest('[data-testid="activity-card-header"]');
    expect(header).not.toBeNull();
    expect(header).toHaveTextContent('outgoing Call');
    expect(header).toHaveTextContent('Karim Elouch');
  });

  it('does not render contact section when no contact name provided', () => {
    render(
      <ActivityKanbanCard
        activity={makeActivity()}
        {...defaultProps}
      />,
      { wrapper: DndWrapper },
    );

    expect(screen.queryByText('·')).toBeNull();
  });

  it('renders contact name with activity-type color class', () => {
    render(
      <ActivityKanbanCard
        activity={makeActivity({ type: 'meeting', direction: null })}
        contactName="Sophie Van Damme"
        {...defaultProps}
      />,
      { wrapper: DndWrapper },
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
      />,
      { wrapper: DndWrapper },
    );

    const badges = container.querySelectorAll('[data-slot="badge"]');
    const contactBadge = Array.from(badges).find(b => b.textContent === 'Karim Elouch');
    expect(contactBadge).toBeUndefined();
  });

  it('shows the activity type icon tile', () => {
    render(<ActivityKanbanCard activity={makeActivity({ type: 'meeting', direction: null })} {...defaultProps} />, {
      wrapper: DndWrapper,
    });
    const header = screen.getByTestId('activity-card-header');
    expect(header.querySelector('[title="Meeting"]')).not.toBeNull();
  });

  it('shows subject, description, creator and date', () => {
    render(
      <ActivityKanbanCard
        activity={makeActivity({ subject: 'Quarterly review', description: '<p>Talked budgets</p>', createdByName: 'Jan Janssens' })}
        {...defaultProps}
      />,
      { wrapper: DndWrapper },
    );
    expect(screen.getByText('Quarterly review')).toBeInTheDocument();
    expect(screen.getByText('Talked budgets').className).toContain('line-clamp-2');
    expect(screen.getByText('Jan Janssens')).toBeInTheDocument();
  });

  it('edit button calls onEdit and not onPreview', () => {
    const onEdit = vi.fn();
    const onPreview = vi.fn();
    render(<ActivityKanbanCard activity={makeActivity()} onEdit={onEdit} onDelete={vi.fn()} onPreview={onPreview} />, {
      wrapper: DndWrapper,
    });
    fireEvent.click(screen.getByLabelText('Edit'));
    expect(onEdit).toHaveBeenCalled();
    expect(onPreview).not.toHaveBeenCalled();
  });

  it('only open cards are draggable', () => {
    const { rerender } = render(<ActivityKanbanCard activity={makeActivity({ activityStatus: 'open' })} {...defaultProps} />, {
      wrapper: DndWrapper,
    });
    expect(screen.getByRole('button', { name: /Test call/ })).toHaveAttribute('draggable', 'true');
    rerender(<ActivityKanbanCard activity={makeActivity({ activityStatus: 'completed' })} {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Test call/ })).toHaveAttribute('draggable', 'false');
  });
});
