import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import OpportunitiesPage from '../page';
import { useOpportunityListStore } from '@/store/opportunityListStore';
import { createOpportunity } from '@/__tests__/mocks/factories';

// Outside Tauri the page loads an empty list, so seed the store after the first render.
const seed = () => {
  useOpportunityListStore.setState({
    opportunities: [
      createOpportunity({ id: 'o1', subject: 'Cloud consolidation', customerId: 'c1', stage: 'Qualified', estimatedRevenue: 120000, probability: 40, createdAt: '2026-10-10T10:00:00.000Z' }),
      createOpportunity({ id: 'o2', subject: 'Azure migration', customerId: 'c2', stage: 'Prospecting', estimatedRevenue: 30000, probability: 5, createdAt: '2026-10-01T10:00:00.000Z' }),
    ],
    customerMap: new Map([['c1', 'Brabant Logistics NV'], ['c2', 'Antwerp Freight BV']]),
    isLoading: false,
  });
};

beforeEach(() => {
  useOpportunityListStore.setState({
    view: 'list',
    selectedId: null,
    searchQuery: '',
    sortBy: 'createdAt',
    sortDir: 'desc',
    filterStage: null,
    filterStatus: null,
    filterExpired: 'all',
    filterCustomerId: null,
    filterPrimaryOwnerId: null,
    filterSecondaryOwnerId: null,
    filterMineOnly: false,
    page: 1,
  });
});

const renderSeeded = async () => {
  render(<OpportunitiesPage />);
  await waitFor(() => expect(useOpportunityListStore.getState().isLoading).toBe(false));
  seed();
};

describe('Pipeline page', () => {
  it('shows the toolbar with open totals', async () => {
    await renderSeeded();
    expect(screen.getByRole('heading', { level: 1, name: 'Pipeline' })).toBeInTheDocument();
    expect(await screen.findByText('2 open · €150K · weighted €50K')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New opportunity/ })).toBeInTheDocument();
  });

  it('lists deals full width, with none opened', async () => {
    await renderSeeded();
    const list = await screen.findByRole('listbox', { name: 'Opportunities' });
    expect(within(list).getAllByRole('option')).toHaveLength(2);
    expect(screen.queryByRole('heading', { level: 2, name: 'Cloud consolidation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Back to pipeline/i })).not.toBeInTheDocument();
  });

  it('opens a deal full width with a way back to the list', async () => {
    await renderSeeded();
    fireEvent.click(await screen.findByRole('option', { name: /Cloud consolidation/ }));
    expect(screen.getByRole('heading', { level: 2, name: 'Cloud consolidation' })).toBeInTheDocument();
    expect(screen.queryByRole('listbox', { name: 'Opportunities' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Back to pipeline/i }));
    expect(await screen.findByRole('listbox', { name: 'Opportunities' })).toBeInTheDocument();
  });

  it('opens the edit wizard from the detail view', async () => {
    await renderSeeded();
    fireEvent.click(await screen.findByRole('option', { name: /Cloud consolidation/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/ }));
    expect(await screen.findByRole('dialog', { name: 'Edit Opportunity' })).toBeInTheDocument();
  });

  it('opens the close dialog from the detail view', async () => {
    await renderSeeded();
    fireEvent.click(await screen.findByRole('option', { name: /Cloud consolidation/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Won$/ }));
    expect(await screen.findByRole('dialog', { name: /Won/ })).toBeInTheDocument();
  });

  it('selects another deal on click', async () => {
    await renderSeeded();
    fireEvent.click(await screen.findByRole('option', { name: /Azure migration/ }));
    expect(screen.getByRole('heading', { level: 2, name: 'Azure migration' })).toBeInTheDocument();
  });

  it('switches to the board with one column per stage', async () => {
    await renderSeeded();
    fireEvent.click(screen.getByRole('button', { name: /Board/ }));
    expect(useOpportunityListStore.getState().view).toBe('board');
    expect(screen.getByRole('region', { name: 'Qualified' })).toHaveTextContent('Cloud consolidation');
    expect(screen.getByRole('region', { name: 'Prospecting' })).toHaveTextContent('Azure migration');
  });
});
