import { vi } from 'vitest';
import type { AccountInfo } from '@azure/msal-browser';

export function createMockAccount(overrides?: Partial<AccountInfo>): AccountInfo {
  return {
    homeAccountId: 'home-123',
    localAccountId: 'local-123',
    environment: 'login.microsoftonline.com',
    tenantId: 'tenant-123',
    username: 'dylan@ingrammicro.com',
    name: 'Dylan Test',
    ...overrides,
  };
}

export function createMockMsalInstance() {
  const accounts = [createMockAccount()];
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    getAllAccounts: vi.fn().mockReturnValue(accounts),
    acquireTokenSilent: vi.fn().mockResolvedValue({
      accessToken: 'mock-access-token',
      account: accounts[0],
    }),
    acquireTokenPopup: vi.fn().mockResolvedValue({
      accessToken: 'mock-popup-token',
      account: accounts[0],
    }),
    loginPopup: vi.fn().mockResolvedValue({
      account: accounts[0],
      accessToken: 'mock-login-token',
    }),
    logoutPopup: vi.fn().mockResolvedValue(undefined),
    setActiveAccount: vi.fn(),
  };
}
