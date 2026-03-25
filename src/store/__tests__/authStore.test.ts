import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import { createMockAccount } from '@/__tests__/mocks/msal';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      account: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      isAdmin: false,
    });
  });

  const store = () => useAuthStore.getState();

  it('initial state', () => {
    expect(store().account).toBeNull();
    expect(store().accessToken).toBeNull();
    expect(store().isAuthenticated).toBe(false);
    expect(store().isLoading).toBe(true);
    expect(store().isAdmin).toBe(false);
  });

  it('setAccount sets account, token, isAuthenticated, isLoading', () => {
    const account = createMockAccount();
    store().setAccount(account, 'token-123');
    expect(store().account).toEqual(account);
    expect(store().accessToken).toBe('token-123');
    expect(store().isAuthenticated).toBe(true);
    expect(store().isLoading).toBe(false);
  });

  it('clearAuth resets everything', () => {
    const account = createMockAccount();
    store().setAccount(account, 'token-123');
    store().setIsAdmin(true);
    store().clearAuth();
    expect(store().account).toBeNull();
    expect(store().accessToken).toBeNull();
    expect(store().isAuthenticated).toBe(false);
    expect(store().isLoading).toBe(false);
    expect(store().isAdmin).toBe(false);
  });

  it('setLoading', () => {
    store().setLoading(false);
    expect(store().isLoading).toBe(false);
  });

  it('setIsAdmin', () => {
    store().setIsAdmin(true);
    expect(store().isAdmin).toBe(true);
  });
});
