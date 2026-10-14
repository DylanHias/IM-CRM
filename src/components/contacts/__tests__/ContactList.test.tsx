import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ContactList } from '../ContactList';
import { createContact } from '@/__tests__/mocks/factories';
import type { Contact } from '@/types/entities';

vi.mock('@/components/contacts/ContactForm', () => ({
  ContactForm: () => null,
}));

const primary = createContact({ id: 'c1', firstName: 'Alice', lastName: 'Martin', isPrimary: true });
const other = createContact({ id: 'c2', firstName: 'Bob', lastName: 'Peeters', isPrimary: false, jobTitle: 'Buyer' });

function renderList(contacts: Contact[], onPrimaryChanged = vi.fn()) {
  render(
    <ContactList
      contacts={contacts}
      customerId="cust-1"
      onContactAdded={vi.fn()}
      onContactUpdated={vi.fn()}
      onContactDeleted={vi.fn()}
      onPrimaryChanged={onPrimaryChanged}
    />,
  );
  return { onPrimaryChanged };
}

describe('ContactList', () => {
  it('renders a card per contact and narrows them with search', async () => {
    renderList([primary, other]);
    expect(screen.getByRole('article', { name: 'Alice Martin' })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Bob Peeters' })).toBeInTheDocument();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search contacts' }), 'bob');

    expect(screen.queryByRole('article', { name: 'Alice Martin' })).not.toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Bob Peeters' })).toBeInTheDocument();
  });

  it('marks the primary contact and hides its set-primary button', () => {
    renderList([primary, other]);
    const card = screen.getByRole('article', { name: 'Alice Martin' });
    expect(within(card).getByText('Primary')).toBeInTheDocument();
    expect(within(card).queryByRole('button', { name: 'Set as primary contact' })).not.toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('calls onPrimaryChanged for a non-primary contact', async () => {
    const { onPrimaryChanged } = renderList([primary, other]);
    const card = screen.getByRole('article', { name: 'Bob Peeters' });
    expect(within(card).queryByText('Primary')).not.toBeInTheDocument();
    await userEvent.click(within(card).getByRole('button', { name: 'Set as primary contact' }));
    expect(onPrimaryChanged).toHaveBeenCalledWith('c2');
  });

  it('shows an empty state when there are no contacts', () => {
    renderList([]);
    expect(screen.getByText('No contacts yet')).toBeInTheDocument();
  });

  it('shows an empty state when the search matches nothing', async () => {
    renderList([primary, other]);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search contacts' }), 'zzz');
    expect(screen.getByText('No matching contacts')).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
