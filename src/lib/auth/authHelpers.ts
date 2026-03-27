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
      if (isTauriApp()) {
        // In Tauri, we can't use popups — re-auth via system browser
        try {
          const { tauriSignIn } = await import('./tauriAuth');
          await tauriSignIn();
          // Retry silent after re-auth
          const retryResult = await instance.acquireTokenSilent({
            scopes,
            account: instance.getAllAccounts()[0],
          });
          return retryResult.accessToken;
        } catch (tauriErr) {
          console.error('[auth] Tauri re-auth failed:', tauriErr);
          return null;
        }
      }
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

export function getActiveAccount(): AccountInfo | null {
  const instance = getMsalInstance();
  const accounts = instance.getAllAccounts();
  return accounts[0] ?? null;
}

export async function signOut(): Promise<void> {
  const instance = getMsalInstance();
  const account = getActiveAccount();
  if (isTauriApp()) {
    // Clear MSAL cache locally — no redirect needed
    if (account) {
      await instance.clearCache({ account });
    }
  } else {
    await instance.logoutPopup({ account: account ?? undefined });
  }
}

export async function signIn(): Promise<{ account: AccountInfo; accessToken: string } | null> {
  const instance = getMsalInstance();
  try {
    if (isTauriApp()) {
      const { tauriSignIn } = await import('./tauriAuth');
      return await tauriSignIn();
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
