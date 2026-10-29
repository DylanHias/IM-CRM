import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CommandPalette } from '../CommandPalette';
import { useUIStore } from '@/store/uiStore';
import { useCustomerStore } from '@/store/customerStore';
import { useOpportunityListStore } from '@/store/opportunityListStore';
import { createCustomer, createOpportunity } from '@/__tests__/mocks/factories';

// cmdk observes its list; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeEach(() => {
  useUIStore.setState({ commandPaletteOpen: true });
  useCustomerStore.setState({
    customers: [createCustomer({ id: 'c1', name: 'Atos Belgium BV', bcn: '374891' })],
    allContacts: [],
  });
  useOpportunityListStore.setState({
    opportunities: [
      createOpportunity({ id: 'o1', subject: 'AWS resell lead', customerId: 'c1', bcn: '374891' }),
      createOpportunity({ id: 'o2', subject: 'Azure migration', customerId: 'c2', bcn: '112233' }),
    ],
  });
});

describe('CommandPalette search', () => {
  it('finds opportunities by BCN', () => {
    render(<CommandPalette />);
    fireEvent.change(screen.getByPlaceholderText(/Search customers/i), { target: { value: '374891' } });
    expect(screen.getByText('AWS resell lead')).toBeInTheDocument();
    expect(screen.queryByText('Azure migration')).not.toBeInTheDocument();
  });

  it('still finds customers by BCN', () => {
    render(<CommandPalette />);
    fireEvent.change(screen.getByPlaceholderText(/Search customers/i), { target: { value: '374891' } });
    expect(screen.getByText('Atos Belgium BV')).toBeInTheDocument();
  });
});
