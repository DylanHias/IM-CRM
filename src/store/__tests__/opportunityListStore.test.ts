import { beforeEach, describe, expect, it } from 'vitest';
import { useOpportunityListStore } from '@/store/opportunityListStore';
import { createOpportunity } from '@/__tests__/mocks/factories';

describe('opportunityListStore search', () => {
  beforeEach(() => {
    useOpportunityListStore.setState({
      opportunities: [],
      customerMap: new Map(),
      searchQuery: '',
    });
  });

  it('matches opportunities by opportunity number', () => {
    const match = createOpportunity({ subject: 'Alpha', opportunityNumber: 'OPP-060214111038-EDA8A' });
    const other = createOpportunity({ subject: 'Beta', opportunityNumber: 'OPP-999999999999-ZZZZZ' });

    useOpportunityListStore.setState({ opportunities: [match, other] });
    useOpportunityListStore.getState().setSearchQuery('eda8a');

    const result = useOpportunityListStore.getState().getFilteredOpportunities();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(match.id);
  });
});

describe('opportunityListStore filter mode', () => {
  const alpha = createOpportunity({ subject: 'Alpha', stage: 'Prospecting', customerId: 'cust-a' });
  const beta = createOpportunity({ subject: 'Beta', stage: 'Qualified', customerId: 'cust-b' });

  beforeEach(() => {
    useOpportunityListStore.setState({
      opportunities: [alpha, beta],
      customerMap: new Map(),
      searchQuery: '',
      filterCustomerId: null,
      filterStage: null,
      filterStatus: null,
      filterExpired: 'all',
      filterPrimaryOwnerId: null,
      filterSecondaryOwnerId: null,
      filterMineOnly: false,
      filterMode: 'and',
    });
  });

  it('returns nothing when AND-combining two mutually exclusive filters', () => {
    useOpportunityListStore.getState().setFilterStage('Prospecting');
    useOpportunityListStore.getState().setFilterCustomerId('cust-b');

    expect(useOpportunityListStore.getState().getFilteredOpportunities()).toHaveLength(0);
  });

  it('returns both matches when OR-combining the same two filters', () => {
    useOpportunityListStore.getState().setFilterStage('Prospecting');
    useOpportunityListStore.getState().setFilterCustomerId('cust-b');
    useOpportunityListStore.getState().setFilterMode('or');

    const result = useOpportunityListStore.getState().getFilteredOpportunities();
    expect(result.map((o) => o.subject).sort()).toEqual(['Alpha', 'Beta']);
  });

  it('keeps search as an AND condition in OR mode', () => {
    useOpportunityListStore.getState().setFilterStage('Prospecting');
    useOpportunityListStore.getState().setFilterCustomerId('cust-b');
    useOpportunityListStore.getState().setFilterMode('or');
    useOpportunityListStore.getState().setSearchQuery('beta');

    const result = useOpportunityListStore.getState().getFilteredOpportunities();
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe('Beta');
  });

  it('returns everything in OR mode when no filter is active', () => {
    useOpportunityListStore.getState().setFilterMode('or');

    expect(useOpportunityListStore.getState().getFilteredOpportunities()).toHaveLength(2);
  });

  it('excludes filter mode from the active filter count', () => {
    useOpportunityListStore.getState().setFilterMode('or');

    expect(useOpportunityListStore.getState().getActiveFilterCount()).toBe(0);
  });

  it('resets filter mode to and on clearFilters', () => {
    useOpportunityListStore.getState().setFilterMode('or');
    useOpportunityListStore.getState().clearFilters();

    expect(useOpportunityListStore.getState().filterMode).toBe('and');
  });
});
