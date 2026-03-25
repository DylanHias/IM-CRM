import { describe, it, expect, beforeEach } from 'vitest';
import { useOpportunityStore } from '../opportunityStore';
import { createOpportunity } from '@/__tests__/mocks/factories';

describe('opportunityStore', () => {
  beforeEach(() => {
    useOpportunityStore.setState({
      opportunities: [],
      currentCustomerId: null,
      isLoading: false,
    });
  });

  const store = () => useOpportunityStore.getState();

  it('setOpportunities', () => {
    const opps = [createOpportunity()];
    store().setOpportunities(opps, 'cust-1');
    expect(store().opportunities).toEqual(opps);
    expect(store().currentCustomerId).toBe('cust-1');
  });

  it('addOpportunity prepends', () => {
    const o1 = createOpportunity({ id: '1' });
    const o2 = createOpportunity({ id: '2' });
    store().setOpportunities([o1], 'cust-1');
    store().addOpportunity(o2);
    expect(store().opportunities[0].id).toBe('2');
  });

  it('updateOpportunity replaces matching', () => {
    const o = createOpportunity({ id: '1', subject: 'Old' });
    store().setOpportunities([o], 'cust-1');
    store().updateOpportunity({ ...o, subject: 'New' });
    expect(store().opportunities[0].subject).toBe('New');
  });

  it('removeOpportunity', () => {
    const o = createOpportunity({ id: '1' });
    store().setOpportunities([o], 'cust-1');
    store().removeOpportunity('1');
    expect(store().opportunities).toHaveLength(0);
  });

  it('clearForCustomer', () => {
    store().setOpportunities([createOpportunity()], 'cust-1');
    store().clearForCustomer();
    expect(store().opportunities).toHaveLength(0);
    expect(store().currentCustomerId).toBeNull();
  });

  it('setLoading', () => {
    store().setLoading(true);
    expect(store().isLoading).toBe(true);
  });
});
