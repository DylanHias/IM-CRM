import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotesTable } from '../NotesTable';
import { createActivity, createContact } from '@/__tests__/mocks/factories';

const baseProps = {
  contacts: [],
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe('NotesTable', () => {
  it('renders nothing when there are no notes', () => {
    const { container } = render(<NotesTable {...baseProps} notes={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a "Notes" panel header with the note count', () => {
    const notes = [
      createActivity({ type: 'note', subject: 'First' }),
      createActivity({ type: 'note', subject: 'Second' }),
    ];
    render(<NotesTable {...baseProps} notes={notes} />);
    const heading = screen.getByRole('heading', { name: 'Notes' });
    expect(heading.parentElement).toHaveTextContent('2');
  });

  it('shows a Pending badge only for notes waiting to sync', () => {
    const notes = [
      createActivity({ type: 'note', subject: 'Waiting', syncStatus: 'pending', occurredAt: '2026-04-02T10:00:00Z' }),
      createActivity({ type: 'note', subject: 'Done', syncStatus: 'synced', occurredAt: '2026-04-01T10:00:00Z' }),
    ];
    render(<NotesTable {...baseProps} notes={notes} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Pending')).toBeInTheDocument();
    expect(within(rows[1]).queryByText('Pending')).toBeNull();
  });

  it('shows the contact name and the description', () => {
    const contact = createContact({ firstName: 'Lien', lastName: 'Peeters' });
    const notes = [createActivity({ type: 'note', contactId: contact.id, description: '<p>Hello there</p>' })];
    render(<NotesTable {...baseProps} contacts={[contact]} notes={notes} />);
    expect(screen.getByText('Lien Peeters')).toBeInTheDocument();
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });

  it('edit button calls onEdit without opening the preview', () => {
    const onEdit = vi.fn();
    const onPreview = vi.fn();
    const note = createActivity({ type: 'note' });
    render(<NotesTable {...baseProps} onEdit={onEdit} onPreview={onPreview} notes={[note]} />);
    fireEvent.click(screen.getByTitle('Edit'));
    expect(onEdit).toHaveBeenCalledWith(note);
    expect(onPreview).not.toHaveBeenCalled();
  });

  it('clicking a row opens the preview', () => {
    const onPreview = vi.fn();
    const note = createActivity({ type: 'note', subject: 'Clickable' });
    render(<NotesTable {...baseProps} onPreview={onPreview} notes={[note]} />);
    fireEvent.click(screen.getByText('Clickable'));
    expect(onPreview).toHaveBeenCalledWith(note);
  });

  it('pages through notes with a compact pager', () => {
    const notes = Array.from({ length: 7 }, (_, i) =>
      createActivity({ type: 'note', subject: `Note ${i + 1}`, occurredAt: `2026-04-${String(20 - i).padStart(2, '0')}T10:00:00Z` }),
    );
    render(<NotesTable {...baseProps} notes={notes} />);
    expect(screen.getByText('1–5 of 7')).toBeInTheDocument();
    expect(screen.queryByText('Note 6')).toBeNull();
    fireEvent.click(screen.getByLabelText('Next page'));
    expect(screen.getByText('Note 6')).toBeInTheDocument();
    expect(screen.getByText('6–7 of 7')).toBeInTheDocument();
  });
});
