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
  const { refreshAccessToken, ConsentRequiredError } = await import('./tauriAuth');
  let result: Awaited<ReturnType<typeof refreshAccessToken>> = null;
  try {
    result = await refreshAccessToken(scopes);
  } catch (err) {
    if (err instanceof ConsentRequiredError) {
      // Admin consent required — interactive sign-in won't fix this. Surface state to UI
      // and skip the popup loop. The user (or admin) must grant consent in Azure first.
      useAuthStore.getState().setConsentRequired(err.scopes);
      return null;
    }
    throw err;
  }
  if (result) {
    useAuthStore.getState().setAccount(result.account, result.accessToken);
    if (useAuthStore.getState().consentRequiredScopes) {
      useAuthStore.getState().setConsentRequired(null);
    }
    return result.accessToken;
  }
  // Refresh token expired — need full re-auth
  try {
    const { tauriSignIn } = await import('./tauriAuth');
    const signInResult = await tauriSignIn();
    if (signInResult) {
      // tauriSignIn returns a Graph-scoped token; exchange refresh token for the requested scope
      try {
        const scopedResult = await refreshAccessToken(scopes);
        if (scopedResult) {
          useAuthStore.getState().setAccount(scopedResult.account, scopedResult.accessToken);
          return scopedResult.accessToken;
        }
      } catch (err) {
        if (err instanceof ConsentRequiredError) {
          useAuthStore.getState().setAccount(signInResult.account, signInResult.accessToken);
          useAuthStore.getState().setConsentRequired(err.scopes);
          return null;
        }
        throw err;
      }
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

export async function restoreSession(): Promise<boolean> {
  if (!isTauriApp()) return false;

  const { loadPersistedSession, refreshAccessToken, ConsentRequiredError } = await import('./tauriAuth');
  const session = await loadPersistedSession();
  if (!session) return false;

  try {
    const result = await refreshAccessToken(['User.Read', 'openid', 'profile']);
    if (result) {
      useAuthStore.getState().setAccount(result.account, result.accessToken);
      return true;
    }
  } catch (err) {
    if (err instanceof ConsentRequiredError) {
      console.error('[auth] Restore failed: admin consent required for Graph scopes');
      return false;
    }
    throw err;
  }
  return false;
}

export async function signOut(): Promise<void> {
  if (isTauriApp()) {
    const { clearPersistedSession } = await import('./tauriAuth');
    await clearPersistedSession();
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
