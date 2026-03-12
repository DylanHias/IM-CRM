import { create } from 'zustand';
import type { AccountInfo } from '@azure/msal-browser';

interface AuthState {
  account: AccountInfo | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAccount: (account: AccountInfo, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  account: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  setAccount: (account, accessToken) =>
    set({ account, accessToken, isAuthenticated: true, isLoading: false }),
  clearAuth: () =>
    set({ account: null, accessToken: null, isAuthenticated: false, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
