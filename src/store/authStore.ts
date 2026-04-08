import { create } from 'zustand';
import type { AccountInfo } from '@azure/msal-browser';

interface AuthState {
  account: AccountInfo | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  profilePhoto: string | null;
  setAccount: (account: AccountInfo, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setProfilePhoto: (photo: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  account: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  profilePhoto: null,
  setAccount: (account, accessToken) =>
    set({ account, accessToken, isAuthenticated: true, isLoading: false }),
  clearAuth: () =>
    set({ account: null, accessToken: null, isAuthenticated: false, isLoading: false, isAdmin: false, profilePhoto: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setProfilePhoto: (profilePhoto) => set({ profilePhoto }),
}));
