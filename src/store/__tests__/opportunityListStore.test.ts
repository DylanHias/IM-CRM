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
