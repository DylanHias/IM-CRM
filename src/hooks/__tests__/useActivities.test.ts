import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useActivities } from '@/hooks/useActivities';
import { useActivityStore } from '@/store/activityStore';
import { useAuthStore } from '@/store/authStore';
import type { AccountInfo } from '@azure/msal-browser';

const CUSTOMER_ID = 'cust-001';

const mockAccount: AccountInfo = {
  homeAccountId: 'home-1',
  localAccountId: 'local-1',
  environment: 'login.microsoftonline.com',
  tenantId: 'tenant-1',
  username: 'dylan@test.com',
  name: 'Dylan Test',
};

describe('useActivities', () => {
  beforeEach(() => {
    useActivityStore.setState({
      activities: [],
      currentCustomerId: null,
      pendingCount: 0,
      isLoading: false,
    });
    useAuthStore.setState({
      account: mockAccount,
      accessToken: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      isAdmin: false,
    });
  });

  it('loads mock activities for customerId', async () => {
    const { result } = renderHook(() => useActivities(CUSTOMER_ID));

    await waitFor(() => {
      expect(result.current.activities.length).toBeGreaterThan(0);
    });

    result.current.activities.forEach((a) => {
      expect(a.customerId).toBe(CUSTOMER_ID);
    });
  });

  it('createActivity creates with UUID, auth info, pending syncStatus', async () => {
    const { result } = renderHook(() => useActivities(CUSTOMER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let created: Awaited<ReturnType<typeof result.current.createActivity>> | undefined;

    await act(async () => {
      created = await result.current.createActivity({
        customerId: CUSTOMER_ID,
        contactId: null,
        type: 'call',
        subject: 'Test call',
        description: 'Test description',
        occurredAt: new Date().toISOString(),
      });
    });

    expect(created).toBeDefined();
    expect(created!.id).toBeTruthy();
    expect(created!.createdById).toBe('local-1');
    expect(created!.createdByName).toBe('Dylan Test');
    expect(created!.syncStatus).toBe('pending');
  });

  it('editActivity updates activity in store', async () => {
    const { result } = renderHook(() => useActivities(CUSTOMER_ID));

    await waitFor(() => {
      expect(result.current.activities.length).toBeGreaterThan(0);
    });

    const original = result.current.activities[0];
    const updated = { ...original, subject: 'Updated subject' };

    await act(async () => {
      await result.current.editActivity(updated);
    });

    const found = result.current.activities.find((a) => a.id === original.id);
    expect(found?.subject).toBe('Updated subject');
  });

  it('deleteActivity removes from store', async () => {
    const { result } = renderHook(() => useActivities(CUSTOMER_ID));

    await waitFor(() => {
      expect(result.current.activities.length).toBeGreaterThan(0);
    });

    const target = result.current.activities[0];
    const countBefore = result.current.activities.length;

    await act(async () => {
      await result.current.deleteActivity(target.id);
    });

    expect(result.current.activities.length).toBe(countBefore - 1);
    expect(result.current.activities.find((a) => a.id === target.id)).toBeUndefined();
  });

  it('filters activities by customerId in return value', async () => {
    const { result } = renderHook(() => useActivities(CUSTOMER_ID));

    await waitFor(() => {
      expect(result.current.activities.length).toBeGreaterThan(0);
    });

    result.current.activities.forEach((a) => {
      expect(a.customerId).toBe(CUSTOMER_ID);
    });
  });
});
