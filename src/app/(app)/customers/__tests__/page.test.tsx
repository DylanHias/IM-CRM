import { render, screen, fireEvent, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRouter } from 'next/navigation';
import CustomersPage from '../page';
import { useCustomerStore } from '@/store/customerStore';
import { createCustomer } from '@/__tests__/mocks/factories';

const a = createCustomer({ id: 'a', name: 'Antwerp Freight BV', lastActivityAt: '2026-10-13T10:00:00.000Z', cloudCustomer: true });
const b = createCustomer({ id: 'b', name: 'Brabant Logistics NV', lastActivityAt: '2026-10-01T10:00:00.000Z', cloudCustomer: false });

beforeEach(() => {
  vi.mocked(useRouter().push).mockClear();
  useCustomerStore.setState({
    customers: [a, b],
    favoriteIds: new Set(),
    searchQuery: '',
    sortBy: 'lastActivity',
    sortDir: 'desc',
    filterOwnerId: null,
    filterStatus: 'all',
    filterCloud: 'all',
    filterFavorites: false,
    page: 1,
    isLoading: false,
  });
});

describe('Customers page', () => {
  it('shows the toolbar and the full-width list, with no customer opened', () => {
    render(<CustomersPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Customers' })).toBeInTheDocument();
    expect(screen.getByText('2 customers')).toBeInTheDocument();
    const list = screen.getByRole('listbox', { name: 'Customers' });
    expect(within(list).getAllByRole('option')).toHaveLength(2);
    expect(within(list).queryAllByRole('option', { selected: true })).toHaveLength(0);
    expect(screen.queryByRole('heading', { level: 2, name: /Antwerp Freight BV/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Back to customers/i })).not.toBeInTheDocument();
  });

  it('opens a customer when its row is clicked', () => {
    render(<CustomersPage />);
    fireEvent.click(screen.getByRole('option', { name: /Brabant Logistics NV/ }));
    expect(useRouter().push).toHaveBeenCalledWith('/customers?id=b');
  });

  it('opens the first customer when the list shortcut moves down from nothing', () => {
    render(<CustomersPage />);
    window.dispatchEvent(new CustomEvent('shortcut:list-down'));
    expect(useRouter().push).toHaveBeenCalledWith('/customers?id=a');
  });

  it('scopes the list to cloud customers', () => {
    render(<CustomersPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Cloud' }));
    expect(useCustomerStore.getState().filterCloud).toBe('cloud');
    expect(within(screen.getByRole('listbox', { name: 'Customers' })).getAllByRole('option')).toHaveLength(1);
  });

  it('searches inside the list', () => {
    render(<CustomersPage />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search customers' }), { target: { value: 'brabant' } });
    expect(within(screen.getByRole('listbox', { name: 'Customers' })).getAllByRole('option')).toHaveLength(1);
  });
});
