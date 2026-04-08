import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('@/lib/sync/directPushService', () => ({
  directPushFollowUp: vi.fn().mockResolvedValue(null),
  directDeleteFollowUp: vi.fn().mockResolvedValue(false),
}));

import { useFollowUps } from '@/hooks/useFollowUps';
import { useFollowUpStore } from '@/store/followUpStore';
import { useAuthStore } from '@/store/authStore';
import { mockFollowUps } from '@/lib/mock/followups';
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

describe('useFollowUps', () => {
  beforeEach(() => {
    useFollowUpStore.setState({
      followUps: mockFollowUps.filter((f) => f.customerId === CUSTOMER_ID),
      currentCustomerId: CUSTOMER_ID,
      overdueCount: 0,
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

  it('returns follow-ups for customerId', () => {
    const { result } = renderHook(() => useFollowUps(CUSTOMER_ID));

    expect(result.current.followUps.length).toBeGreaterThan(0);
    result.current.followUps.forEach((f) => {
      expect(f.customerId).toBe(CUSTOMER_ID);
    });
  });

  it('createFollowUp creates with defaults (completed=false)', async () => {
    const { result } = renderHook(() => useFollowUps(CUSTOMER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let created: Awaited<ReturnType<typeof result.current.createFollowUp>> | undefined;

    await act(async () => {
      created = await result.current.createFollowUp({
        customerId: CUSTOMER_ID,
        activityId: null,
        title: 'Test follow-up',
        description: 'Test description',
        dueDate: '2026-04-01',
      });
    });

    expect(created).toBeDefined();
    expect(created!.id).toBeTruthy();
    expect(created!.completed).toBe(false);
    expect(created!.completedAt).toBeNull();
    expect(created!.syncStatus).toBe('pending');
    expect(created!.createdById).toBe('local-1');
    expect(created!.createdByName).toBe('Dylan Test');
  });

  it('completeFollowUp marks as complete in store', async () => {
    const { result } = renderHook(() => useFollowUps(CUSTOMER_ID));

    const target = result.current.followUps.find((f) => !f.completed);
    expect(target).toBeDefined();

    await act(async () => {
      await result.current.completeFollowUp(target!.id);
    });

    const updated = result.current.followUps.find((f) => f.id === target!.id);
    expect(updated?.completed).toBe(true);
    expect(updated?.completedAt).toBeTruthy();
  });

  it('deleteFollowUp removes from store', async () => {
    const { result } = renderHook(() => useFollowUps(CUSTOMER_ID));

    const target = result.current.followUps[0];
    const countBefore = result.current.followUps.length;

    await act(async () => {
      await result.current.deleteFollowUp(target.id);
    });

    expect(result.current.followUps.length).toBe(countBefore - 1);
    expect(result.current.followUps.find((f) => f.id === target.id)).toBeUndefined();
  });
});
