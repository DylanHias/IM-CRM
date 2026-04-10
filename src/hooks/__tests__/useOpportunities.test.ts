import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('@/lib/sync/directPushService', () => ({
  directPushOpportunity: vi.fn().mockResolvedValue(null),
}));

import { useOpportunities } from '@/hooks/useOpportunities';
import { useOpportunityStore } from '@/store/opportunityStore';
import { useAuthStore } from '@/store/authStore';
import { mockOpportunities } from '@/lib/mock/opportunities';
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

describe('useOpportunities', () => {
  beforeEach(() => {
    useOpportunityStore.setState({
      opportunities: mockOpportunities.filter((o) => o.customerId === CUSTOMER_ID),
      currentCustomerId: CUSTOMER_ID,
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

  it('returns opportunities for customerId', () => {
    const { result } = renderHook(() => useOpportunities(CUSTOMER_ID));

    expect(result.current.opportunities.length).toBeGreaterThan(0);
    result.current.opportunities.forEach((o) => {
      expect(o.customerId).toBe(CUSTOMER_ID);
    });
  });

  it('createOpportunity creates with UUID, auth info, pending syncStatus', async () => {
    const { result } = renderHook(() => useOpportunities(CUSTOMER_ID));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let created: Awaited<ReturnType<typeof result.current.createOpportunity>> | undefined;

    await act(async () => {
      created = await result.current.createOpportunity({
        customerId: CUSTOMER_ID,
        contactId: null,
        status: 'Open',
        subject: 'Test opportunity',
        bcn: null,
        multiVendorOpportunity: false,
        sellType: 'New',
        primaryVendor: null,
        opportunityType: null,
        stage: 'Prospecting',
        probability: 5,
        expirationDate: null,
        estimatedRevenue: null,
        currency: 'EUR',
        country: 'Belgium',
        source: 'cloud',
        recordType: 'Sales',
        customerNeed: null,
      });
    });

    expect(created).toBeDefined();
    expect(created!.id).toBeTruthy();
    expect(created!.createdById).toBe('local-1');
    expect(created!.createdByName).toBe('Dylan Test');
    expect(created!.syncStatus).toBe('pending');
  });

  it('editOpportunity updates opportunity in store', async () => {
    const { result } = renderHook(() => useOpportunities(CUSTOMER_ID));

    const original = result.current.opportunities[0];
    const updated = { ...original, subject: 'Updated subject' };

    await act(async () => {
      await result.current.editOpportunity(updated);
    });

    const found = result.current.opportunities.find((o) => o.id === original.id);
    expect(found?.subject).toBe('Updated subject');
  });

  it('filters opportunities by customerId in return value', () => {
    const { result } = renderHook(() => useOpportunities(CUSTOMER_ID));

    result.current.opportunities.forEach((o) => {
      expect(o.customerId).toBe(CUSTOMER_ID);
    });
  });
});
