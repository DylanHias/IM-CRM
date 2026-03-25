import { describe, it, expect, beforeEach } from 'vitest';
import { useActivityStore } from '../activityStore';
import { createActivity } from '@/__tests__/mocks/factories';

describe('activityStore', () => {
  beforeEach(() => {
    useActivityStore.setState({
      activities: [],
      currentCustomerId: null,
      pendingCount: 0,
      isLoading: false,
    });
  });

  const store = () => useActivityStore.getState();

  it('setActivities sets activities and customerId', () => {
    const acts = [createActivity()];
    store().setActivities(acts, 'cust-1');
    expect(store().activities).toEqual(acts);
    expect(store().currentCustomerId).toBe('cust-1');
  });

  it('addActivity prepends to list', () => {
    const a1 = createActivity({ id: '1', subject: 'First' });
    const a2 = createActivity({ id: '2', subject: 'Second' });
    store().setActivities([a1], 'cust-1');
    store().addActivity(a2);
    expect(store().activities[0].id).toBe('2');
    expect(store().activities[1].id).toBe('1');
  });

  it('addActivity increments pendingCount when syncStatus is pending', () => {
    const a = createActivity({ syncStatus: 'pending' });
    store().addActivity(a);
    expect(store().pendingCount).toBe(1);
  });

  it('addActivity does NOT increment pendingCount when syncStatus is synced', () => {
    const a = createActivity({ syncStatus: 'synced' });
    store().addActivity(a);
    expect(store().pendingCount).toBe(0);
  });

  it('updateActivity replaces matching activity', () => {
    const a = createActivity({ id: '1', subject: 'Old' });
    store().setActivities([a], 'cust-1');
    store().updateActivity({ ...a, subject: 'New' });
    expect(store().activities[0].subject).toBe('New');
  });

  it('updateActivity with non-existent id is a no-op', () => {
    const a = createActivity({ id: '1' });
    store().setActivities([a], 'cust-1');
    store().updateActivity(createActivity({ id: 'nonexistent', subject: 'X' }));
    expect(store().activities).toHaveLength(1);
    expect(store().activities[0].id).toBe('1');
  });

  it('removeActivity removes by id', () => {
    const a = createActivity({ id: '1' });
    store().setActivities([a], 'cust-1');
    store().removeActivity('1');
    expect(store().activities).toHaveLength(0);
  });

  it('removeActivity with non-existent id is a no-op', () => {
    const a = createActivity({ id: '1' });
    store().setActivities([a], 'cust-1');
    store().removeActivity('nonexistent');
    expect(store().activities).toHaveLength(1);
  });

  it('setPendingCount', () => {
    store().setPendingCount(5);
    expect(store().pendingCount).toBe(5);
  });

  it('setLoading', () => {
    store().setLoading(true);
    expect(store().isLoading).toBe(true);
  });

  it('clearForCustomer resets activities and currentCustomerId', () => {
    store().setActivities([createActivity()], 'cust-1');
    store().clearForCustomer();
    expect(store().activities).toHaveLength(0);
    expect(store().currentCustomerId).toBeNull();
  });
});
