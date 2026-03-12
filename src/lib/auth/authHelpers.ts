import { InteractionRequiredAuthError, type AccountInfo } from '@azure/msal-browser';
import { getMsalInstance } from './msalInstance';
import { loginRequest } from './msalConfig';

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
  await instance.logoutPopup({ account: account ?? undefined });
}

export async function signIn(): Promise<{ account: AccountInfo; accessToken: string } | null> {
  const instance = getMsalInstance();
  try {
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
