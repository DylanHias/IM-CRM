import { render, screen, fireEvent, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpportunityList } from '../OpportunityList';
import { useCustomerStore } from '@/store/customerStore';
import { createCustomer, createOpportunity } from '@/__tests__/mocks/factories';
import type { Opportunity } from '@/types/entities';

const mockState: { opportunities: Opportunity[] } = { opportunities: [] };

vi.mock('@/hooks/useOpportunities', () => ({
  useOpportunities: () => ({
    opportunities: mockState.opportunities,
    createOpportunity: vi.fn(),
    editOpportunity: vi.fn(),
  }),
}));

vi.mock('../OpportunityWizard', () => ({
  OpportunityWizard: ({ opportunity }: { opportunity?: Opportunity }) => (
    <div data-testid="wizard">{opportunity ? `Editing ${opportunity.subject}` : 'New wizard'}</div>
  ),
}));

beforeEach(() => {
  mockState.opportunities = [];
  useCustomerStore.setState({ customers: [createCustomer({ id: 'c1', name: 'Acme NV' })] });
});

describe('OpportunityList', () => {
  it('summarises open deals and lists every deal', () => {
    mockState.opportunities = [
      createOpportunity({ id: 'o1', customerId: 'c1', subject: 'Azure migration', status: 'Open', estimatedRevenue: 100000 }),
      createOpportunity({ id: 'o2', customerId: 'c1', subject: 'M365 renewal', status: 'Open', estimatedRevenue: 50000 }),
      createOpportunity({ id: 'o3', customerId: 'c1', subject: 'Old deal', status: 'Won', estimatedRevenue: 20000 }),
    ];
    render(<OpportunityList customerId="c1" />);
    expect(screen.getByText('2 open · €150K')).toBeInTheDocument();
    const list = screen.getByRole('listbox', { name: 'Opportunities' });
    expect(within(list).getAllByRole('option')).toHaveLength(3);
  });

  it('shows an empty state without deals', () => {
    render(<OpportunityList customerId="c1" />);
    expect(screen.getByText('0 open · €0')).toBeInTheDocument();
    expect(screen.getByText('No opportunities yet')).toBeInTheDocument();
  });

  it('opens the wizard from the New opportunity button', () => {
    render(<OpportunityList customerId="c1" />);
    fireEvent.click(screen.getByRole('button', { name: /New opportunity/ }));
    expect(screen.getByText('New wizard')).toBeInTheDocument();
  });

  it('opens the wizard when triggerAdd increments', () => {
    const { rerender } = render(<OpportunityList customerId="c1" triggerAdd={0} />);
    expect(screen.queryByTestId('wizard')).not.toBeInTheDocument();
    rerender(<OpportunityList customerId="c1" triggerAdd={1} />);
    expect(screen.getByText('New wizard')).toBeInTheDocument();
  });

  it('opens the edit wizard when a row is clicked', () => {
    mockState.opportunities = [createOpportunity({ id: 'o1', customerId: 'c1', subject: 'Azure migration' })];
    render(<OpportunityList customerId="c1" />);
    fireEvent.click(screen.getByRole('option', { name: /Azure migration/ }));
    expect(screen.getByText('Editing Azure migration')).toBeInTheDocument();
  });

  it('offers a right-click menu on each row', () => {
    mockState.opportunities = [createOpportunity({ id: 'o1', customerId: 'c1', subject: 'Azure migration', status: 'Open' })];
    render(<OpportunityList customerId="c1" />);
    fireEvent.contextMenu(screen.getByRole('option', { name: /Azure migration/ }));
    expect(screen.getByRole('menuitem', { name: 'Open' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Close as Won/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Close as Lost/ })).toBeInTheDocument();
  });
});
