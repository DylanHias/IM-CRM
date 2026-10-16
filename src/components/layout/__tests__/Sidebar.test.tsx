import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppSidebar } from '../Sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useCustomerStore } from '@/store/customerStore';
import { useUIStore } from '@/store/uiStore';
import { useSyncStore } from '@/store/syncStore';
import { createCustomer } from '@/__tests__/mocks/factories';

const renderSidebar = () =>
  render(
    <SidebarProvider open onOpenChange={() => {}}>
      <AppSidebar />
    </SidebarProvider>,
  );

beforeEach(() => {
  const fav = createCustomer({ id: 'c-fav', name: 'Brabant Logistics NV' });
  const recent = createCustomer({ id: 'c-rec', name: 'Antwerp Freight BV' });
  useCustomerStore.setState({ customers: [fav, recent], favoriteIds: new Set(['c-fav']) });
  useUIStore.setState({ recentCustomerIds: ['c-rec'] });
  useSyncStore.setState({ pendingActivityCount: 3, pendingFollowUpCount: 0, pendingOpportunityCount: 0 });
});

describe('AppSidebar', () => {
  it('does not show Sync as a sidebar item', () => {
    renderSidebar();
    expect(screen.queryByRole('link', { name: /^sync$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /customers/i })).toBeInTheDocument();
  });

  it('links favorites and recent customers straight to the customer, without sub-links', () => {
    renderSidebar();
    expect(screen.getByRole('link', { name: /Brabant Logistics NV/ })).toHaveAttribute('href', '/customers?id=c-fav');
    expect(screen.getByRole('link', { name: /Antwerp Freight BV/ })).toHaveAttribute('href', '/customers?id=c-rec');
    expect(screen.queryByRole('link', { name: 'Contacts' })).not.toBeInTheDocument();
  });

  it('labels the favorites and recent groups', () => {
    renderSidebar();
    expect(screen.getByText('Favorites')).toBeInTheDocument();
    expect(screen.getByText('Recent')).toBeInTheDocument();
  });

  it('has a New button and the collapse control', () => {
    renderSidebar();
    expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /collapse/i })).toBeInTheDocument();
  });
});
