import { InteractionRequiredAuthError, type AccountInfo } from '@azure/msal-browser';
import { getMsalInstance } from './msalInstance';
import { loginRequest } from './msalConfig';
import { isTauriApp } from '@/lib/utils/offlineUtils';

export async function getAccessToken(scopes: string[]): Promise<string | null> {
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
      } catch {
        return null;
      }
    }
    console.error('[auth] Token acquisition failed:', err);
    return null;
  }
}

export function getActiveAccount(): AccountInfo | null {
  const instance = getMsalInstance();
  const accounts = instance.getAllAccounts();
  return accounts[0] ?? null;
}

export async function signOut(): Promise<void> {
  const instance = getMsalInstance();
  const account = getActiveAccount();
  if (isTauriApp()) {
    await instance.logoutRedirect({ account: account ?? undefined });
  } else {
    await instance.logoutPopup({ account: account ?? undefined });
  }
}

export async function signIn(): Promise<{ account: AccountInfo; accessToken: string } | null> {
  const instance = getMsalInstance();
  try {
    if (isTauriApp()) {
      // Redirect flow: navigates away, response is handled on page reload
      // via handleRedirectPromise() in providers.tsx
      await instance.loginRedirect(loginRequest);
      return null; // Won't reach here — page navigates away
    }

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
