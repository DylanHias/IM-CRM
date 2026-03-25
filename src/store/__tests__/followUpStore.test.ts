import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useFollowUpStore } from '../followUpStore';
import { createFollowUp } from '@/__tests__/mocks/factories';

describe('followUpStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T12:00:00.000Z'));
    useFollowUpStore.setState({
      followUps: [],
      currentCustomerId: null,
      overdueCount: 0,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const store = () => useFollowUpStore.getState();

  it('setFollowUps', () => {
    const fus = [createFollowUp()];
    store().setFollowUps(fus, 'cust-1');
    expect(store().followUps).toEqual(fus);
    expect(store().currentCustomerId).toBe('cust-1');
  });

  it('addFollowUp appends', () => {
    const f1 = createFollowUp({ id: '1' });
    const f2 = createFollowUp({ id: '2' });
    store().setFollowUps([f1], 'cust-1');
    store().addFollowUp(f2);
    expect(store().followUps).toHaveLength(2);
    expect(store().followUps[1].id).toBe('2');
  });

  it('updateFollowUp replaces matching', () => {
    const f = createFollowUp({ id: '1', title: 'Old' });
    store().setFollowUps([f], 'cust-1');
    store().updateFollowUp({ ...f, title: 'New' });
    expect(store().followUps[0].title).toBe('New');
  });

  it('removeFollowUp removes by id', () => {
    const f = createFollowUp({ id: '1' });
    store().setFollowUps([f], 'cust-1');
    store().removeFollowUp('1');
    expect(store().followUps).toHaveLength(0);
  });

  it('markComplete sets completed, completedAt, syncStatus', () => {
    const f = createFollowUp({ id: '1', completed: false, dueDate: '2026-04-01' });
    store().setFollowUps([f], 'cust-1');
    store().markComplete('1');
    const updated = store().followUps[0];
    expect(updated.completed).toBe(true);
    expect(updated.completedAt).toBeTruthy();
    expect(updated.syncStatus).toBe('pending');
  });

  it('markComplete decrements overdueCount when follow-up was overdue', () => {
    const f = createFollowUp({ id: '1', completed: false, dueDate: '2026-03-20' }); // past
    store().setFollowUps([f], 'cust-1');
    useFollowUpStore.setState({ overdueCount: 3 });
    store().markComplete('1');
    expect(store().overdueCount).toBe(2);
  });

  it('markComplete does NOT decrement overdueCount when not overdue', () => {
    const f = createFollowUp({ id: '1', completed: false, dueDate: '2026-04-01' }); // future
    store().setFollowUps([f], 'cust-1');
    useFollowUpStore.setState({ overdueCount: 3 });
    store().markComplete('1');
    expect(store().overdueCount).toBe(3);
  });

  it('markComplete with overdueCount=0 stays at 0', () => {
    const f = createFollowUp({ id: '1', completed: false, dueDate: '2026-03-20' });
    store().setFollowUps([f], 'cust-1');
    useFollowUpStore.setState({ overdueCount: 0 });
    store().markComplete('1');
    expect(store().overdueCount).toBe(0);
  });

  it('markComplete on already-completed follow-up', () => {
    const f = createFollowUp({ id: '1', completed: true, completedAt: '2026-03-20T00:00:00.000Z', dueDate: '2026-03-20' });
    store().setFollowUps([f], 'cust-1');
    useFollowUpStore.setState({ overdueCount: 1 });
    store().markComplete('1');
    // Still completed, overdueCount shouldn't change because it wasn't incomplete
    expect(store().followUps[0].completed).toBe(true);
  });

  it('setOverdueCount', () => {
    store().setOverdueCount(5);
    expect(store().overdueCount).toBe(5);
  });

  it('setLoading', () => {
    store().setLoading(true);
    expect(store().isLoading).toBe(true);
  });
});
