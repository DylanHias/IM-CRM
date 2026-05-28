import { create } from 'zustand';
import type { AccountInfo } from '@azure/msal-browser';
import type { GraphUserProfile } from '@/lib/auth/graphApi';

interface AuthState {
  account: AccountInfo | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  profilePhoto: string | null;
  userProfile: GraphUserProfile | null;
  consentRequiredScopes: string[] | null;
  setAccount: (account: AccountInfo, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setProfilePhoto: (photo: string | null) => void;
  setUserProfile: (profile: GraphUserProfile | null) => void;
  setConsentRequired: (scopes: string[] | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  account: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  profilePhoto: null,
  userProfile: null,
  consentRequiredScopes: null,
  setAccount: (account, accessToken) =>
    set({ account, accessToken, isAuthenticated: true, isLoading: false }),
  clearAuth: () =>
    set({ account: null, accessToken: null, isAuthenticated: false, isLoading: false, isAdmin: false, profilePhoto: null, userProfile: null, consentRequiredScopes: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setProfilePhoto: (profilePhoto) => set({ profilePhoto }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setConsentRequired: (consentRequiredScopes) => set({ consentRequiredScopes }),
}));
