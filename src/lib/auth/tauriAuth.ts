import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-shell';
import { loginRequest } from './msalConfig';
import type { AccountInfo } from '@azure/msal-browser';

const CLIENT_ID = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ?? '';
const TENANT_ID = process.env.NEXT_PUBLIC_AZURE_TENANT_ID ?? 'common';
const AUTHORITY = `https://login.microsoftonline.com/${TENANT_ID}`;

const REFRESH_TOKEN_KEY = 'auth.refresh_token';
const ACCOUNT_KEY = 'auth.account';

interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string | null;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface IdTokenClaims {
  oid?: string;
  sub?: string;
  tid?: string;
  preferred_username?: string;
  name?: string;
  email?: string;
}

async function generatePkce(): Promise<{ verifier: string; challenge: string }> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = btoa(Array.from(array, (b) => String.fromCharCode(b)).join(''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const encoded = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  const challenge = btoa(Array.from(new Uint8Array(hash), (b) => String.fromCharCode(b)).join(''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return { verifier, challenge };
}

function parseIdToken(idToken: string): IdTokenClaims {
  const parts = idToken.split('.');
  if (parts.length < 2) return {};
  const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(payload));
}

function buildAccountInfo(claims: IdTokenClaims): AccountInfo {
  const localAccountId = claims.oid ?? claims.sub ?? crypto.randomUUID();
  return {
    homeAccountId: `${localAccountId}.${claims.tid ?? TENANT_ID}`,
    environment: 'login.microsoftonline.com',
    tenantId: claims.tid ?? TENANT_ID,
    username: claims.preferred_username ?? claims.email ?? '',
    localAccountId,
    name: claims.name ?? undefined,
    idTokenClaims: claims,
    nativeAccountId: undefined,
    authorityType: 'MSSTS',
  } as AccountInfo;
}

let storedRefreshToken: string | null = null;

async function persistRefreshToken(token: string): Promise<void> {
  storedRefreshToken = token;
  try {
    const { setAppSetting } = await import('@/lib/db/queries/sync');
    await setAppSetting(REFRESH_TOKEN_KEY, token);
  } catch (err) {
    console.error('[auth] Failed to persist refresh token:', err);
  }
}

async function persistAccount(account: AccountInfo): Promise<void> {
  try {
    const { setAppSetting } = await import('@/lib/db/queries/sync');
    await setAppSetting(ACCOUNT_KEY, JSON.stringify(account));
  } catch (err) {
    console.error('[auth] Failed to persist account:', err);
  }
}

export async function loadPersistedSession(): Promise<{ account: AccountInfo; refreshToken: string } | null> {
  try {
    const { getAppSetting } = await import('@/lib/db/queries/sync');
    const [refreshToken, accountJson] = await Promise.all([
      getAppSetting(REFRESH_TOKEN_KEY),
      getAppSetting(ACCOUNT_KEY),
    ]);

    if (!refreshToken || !accountJson) return null;

    storedRefreshToken = refreshToken;
    const account = JSON.parse(accountJson) as AccountInfo;
    return { account, refreshToken };
  } catch (err) {
    console.error('[auth] Failed to load persisted session:', err);
    return null;
  }
}

export async function clearPersistedSession(): Promise<void> {
  storedRefreshToken = null;
  try {
    const { setAppSetting } = await import('@/lib/db/queries/sync');
    await Promise.all([
      setAppSetting(REFRESH_TOKEN_KEY, ''),
      setAppSetting(ACCOUNT_KEY, ''),
    ]);
  } catch (err) {
    console.error('[auth] Failed to clear persisted session:', err);
  }
}

export async function refreshAccessToken(scopes: string[]): Promise<{ accessToken: string; account: AccountInfo } | null> {
  if (!storedRefreshToken) {
    const session = await loadPersistedSession();
    if (!session) return null;
  }

  try {
    const tokens: TokenResponse = await invoke('refresh_oauth_token', {
      refreshToken: storedRefreshToken,
      clientId: CLIENT_ID,
      tenantId: TENANT_ID,
      scopes: scopes.join(' '),
    });

    if (tokens.refresh_token) {
      await persistRefreshToken(tokens.refresh_token);
    }

    const claims = parseIdToken(tokens.id_token);
    const account = buildAccountInfo(claims);
    await persistAccount(account);
    return { accessToken: tokens.access_token, account };
  } catch (err) {
    console.error('[auth] Refresh token exchange failed:', err);
    storedRefreshToken = null;
    return null;
  }
}

export async function tauriSignIn(): Promise<{ account: AccountInfo; accessToken: string } | null> {
  const port: number = await invoke('start_oauth_server');
  const redirectUri = `http://localhost:${port}`;
  const { verifier, challenge } = await generatePkce();

  const scopes = `${loginRequest.scopes.join(' ')} offline_access`;
  const state = crypto.randomUUID();
  const authUrl = [
    `${AUTHORITY}/oauth2/v2.0/authorize`,
    `?client_id=${encodeURIComponent(CLIENT_ID)}`,
    `&response_type=code`,
    `&redirect_uri=${encodeURIComponent(redirectUri)}`,
    `&response_mode=query`,
    `&scope=${encodeURIComponent(scopes)}`,
    `&state=${state}`,
    `&code_challenge=${encodeURIComponent(challenge)}`,
    `&code_challenge_method=S256`,
  ].join('');

  await open(authUrl);

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = async () => {
      unlistenCallback();
      unlistenError();
      try { await invoke('stop_oauth_server'); } catch { /* already stopped */ }
    };

    const timeout = setTimeout(async () => {
      if (!settled) {
        settled = true;
        await cleanup();
        reject(new Error('OAuth login timed out after 5 minutes'));
      }
    }, 5 * 60 * 1000);

    let unlistenCallback: () => void = () => {};
    let unlistenError: () => void = () => {};

    const setup = async () => {
      unlistenCallback = await listen<string>('oauth-callback', async (event) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);

        try {
          const tokens: TokenResponse = await invoke('exchange_oauth_code', {
            code: event.payload,
            redirectUri,
            codeVerifier: verifier,
            clientId: CLIENT_ID,
            tenantId: TENANT_ID,
            scopes,
          });

          const claims = parseIdToken(tokens.id_token);
          const account = buildAccountInfo(claims);

          if (tokens.refresh_token) {
            await persistRefreshToken(tokens.refresh_token);
          }
          await persistAccount(account);

          await cleanup();
          resolve({ account, accessToken: tokens.access_token });
        } catch (err) {
          await cleanup();
          reject(err);
        }
      });

      unlistenError = await listen<string>('oauth-error', async (event) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        await cleanup();
        reject(new Error(event.payload));
      });
    };

    setup().catch(reject);
  });
}
