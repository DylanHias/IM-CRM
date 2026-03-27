import { InteractionRequiredAuthError, type AccountInfo } from '@azure/msal-browser';
import { getMsalInstance } from './msalInstance';
import { loginRequest } from './msalConfig';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { useAuthStore } from '@/store/authStore';

export async function getAccessToken(scopes: string[]): Promise<string | null> {
  if (isTauriApp()) {
    return getTauriAccessToken(scopes);
  }

  const instance = getMsalInstance();
  const accounts = instance.getAllAccounts();
  if (accounts.length === 0) return null;

  try {
    const result = await instance.acquireTokenSilent({
      scopes,
      account: accounts[0],
    });
    return result.accessToken;
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      try {
        const result = await instance.acquireTokenPopup({ scopes });
        return result.accessToken;
      } catch (popupErr) {
        console.error('[auth] Popup token acquisition failed:', popupErr);
        return null;
      }
    }
    console.error('[auth] Token acquisition failed:', err);
    return null;
  }
}

async function getTauriAccessToken(scopes: string[]): Promise<string | null> {
  const { refreshAccessToken } = await import('./tauriAuth');
  const result = await refreshAccessToken(scopes);
  if (result) {
    useAuthStore.getState().setAccount(result.account, result.accessToken);
    return result.accessToken;
  }
  // Refresh token expired — need full re-auth
  try {
    const { tauriSignIn } = await import('./tauriAuth');
    const signInResult = await tauriSignIn();
    if (signInResult) {
      useAuthStore.getState().setAccount(signInResult.account, signInResult.accessToken);
      return signInResult.accessToken;
    }
  } catch (err) {
    console.error('[auth] Tauri re-auth failed:', err);
  }
  return null;
}

export function getActiveAccount(): AccountInfo | null {
  if (isTauriApp()) {
    return useAuthStore.getState().account;
  }
  const instance = getMsalInstance();
  const accounts = instance.getAllAccounts();
  return accounts[0] ?? null;
}

export async function signOut(): Promise<void> {
  if (isTauriApp()) {
    useAuthStore.getState().clearAuth();
    return;
  }
  const instance = getMsalInstance();
  const account = getActiveAccount();
  await instance.logoutPopup({ account: account ?? undefined });
}

export async function signIn(): Promise<{ account: AccountInfo; accessToken: string } | null> {
  if (isTauriApp()) {
    const { tauriSignIn } = await import('./tauriAuth');
    return await tauriSignIn();
  }

  try {
    const instance = getMsalInstance();
    const result = await instance.loginPopup(loginRequest);
    if (result.account) {
      instance.setActiveAccount(result.account);
      return { account: result.account, accessToken: result.accessToken };
    }
    return null;
  } catch (err) {
    console.error('[auth] Login failed:', err);
    return null;
  }
}
