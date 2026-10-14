import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RevenueTabContent } from '../RevenueTabContent';
import { useRevenueStore, type CustomerRevenueRow } from '@/store/revenueStore';
import { useCustomerRevenueDetailStore } from '@/store/customerRevenueDetailStore';
import { createCustomer } from '@/__tests__/mocks/factories';

vi.mock('@/components/revenue/RefreshButton', () => ({
  RefreshButton: () => <button type="button">Refresh</button>,
}));

const row: CustomerRevenueRow = {
  bcn: 'BCN1',
  pbiCustomerId: null,
  resellerAccount: null,
  arrUsd: 130000,
  arrLc: 120000,
  currencyCode: 'EUR',
  asOfMonth: '2026-09-01',
  activeEndCustomers: 37,
  refreshedAt: '2026-10-14T08:00:00.000Z',
};

beforeEach(() => {
  useRevenueStore.setState({ byBcn: new Map(), byResellerAccount: new Map(), lastRefreshedAt: null });
  useCustomerRevenueDetailStore.setState({ movementByBcn: new Map(), isHydrated: true });
});

describe('RevenueTabContent', () => {
  it('shows live ARR, end customers and Power BI as the source', () => {
    useRevenueStore.setState({ byBcn: new Map([['BCN1', row]]) });
    render(<RevenueTabContent customer={createCustomer({ bcn: 'BCN1', arr: null })} />);

    expect(screen.getByText('Current ARR')).toBeInTheDocument();
    expect(screen.getByText(/120[.\s ]?000/)).toBeInTheDocument();
    expect(screen.getByText(/as of September 2026/)).toBeInTheDocument();
    expect(screen.getByText('Active end customers')).toBeInTheDocument();
    expect(screen.getByText('37')).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
    expect(screen.getByText('Power BI')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ARR movement' })).toBeInTheDocument();
    expect(screen.getByText('last 12 months')).toBeInTheDocument();
  });

  it('falls back to the synced Dynamics 365 value', () => {
    render(<RevenueTabContent customer={createCustomer({ bcn: 'BCN2', arr: 50000 })} />);
    expect(screen.getByText('Synced')).toBeInTheDocument();
    expect(screen.getByText('Dynamics 365')).toBeInTheDocument();
    expect(screen.queryByText('Active end customers')).not.toBeInTheDocument();
  });

  it('shows an empty state when the customer has no BCN', () => {
    render(<RevenueTabContent customer={createCustomer({ bcn: null, arr: null })} />);
    expect(screen.getByText('No movement data')).toBeInTheDocument();
    expect(screen.getByText('This customer has no BCN in Dynamics 365.')).toBeInTheDocument();
  });

  it('shows an empty state when no movement was recorded', () => {
    render(<RevenueTabContent customer={createCustomer({ bcn: 'BCN3', arr: null })} />);
    expect(screen.getByText('No movement data')).toBeInTheDocument();
  });

  it('has a period picker and refresh controls', () => {
    render(<RevenueTabContent customer={createCustomer({ bcn: 'BCN1' })} />);
    expect(screen.getByRole('combobox', { name: 'Period' })).toHaveTextContent('Last 12 months');
    expect(screen.getByText('Never refreshed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });
});
