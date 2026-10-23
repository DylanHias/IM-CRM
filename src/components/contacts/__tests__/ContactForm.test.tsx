import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactForm } from '../ContactForm';
import { useLookupTableStore } from '@/store/lookupTableStore';

describe('ContactForm required fields', () => {
  beforeEach(() => {
    useLookupTableStore.setState({
      lookupTables: {
        'opportunity.country': [{ remoteId: 'c-be', label: 'Belgium' }],
        'contact.contacttype': [{ remoteId: 't-1', label: 'Decision Maker' }],
      },
      isLoaded: true,
    });
  });

  it('blocks submit until contact type, country, phone and email are filled', async () => {
    const onContactSaved = vi.fn();
    render(
      <ContactForm open onOpenChange={vi.fn()} customerId="cust-1" onContactSaved={onContactSaved} />,
    );

    await userEvent.type(screen.getByLabelText(/First Name/), 'Alice');
    await userEvent.type(screen.getByLabelText(/Last Name/), 'Martin');
    await userEvent.click(screen.getByRole('button', { name: 'Add Contact' }));

    expect(onContactSaved).not.toHaveBeenCalled();
    for (const label of [/^Country/, /^Contact Type/, /^Phone/, /^Email/]) {
      expect(screen.getByText(label)).toHaveClass('text-rose-600');
    }
  });
});
