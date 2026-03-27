import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-shell';
import { loginRequest } from './msalConfig';
import type { AccountInfo } from '@azure/msal-browser';

async function getTauriFetch(): Promise<typeof globalThis.fetch> {
  const { fetch: f } = await import('@tauri-apps/plugin-http');
  return f;
}

const CLIENT_ID = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ?? '';
const TENANT_ID = process.env.NEXT_PUBLIC_AZURE_TENANT_ID ?? 'common';
const AUTHORITY = `https://login.microsoftonline.com/${TENANT_ID}`;

interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
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

async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    scope: loginRequest.scopes.join(' '),
  });

  const tauriFetch = await getTauriFetch();
  const res = await tauriFetch(`${AUTHORITY}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  return res.json();
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

// Store refresh token for silent token renewal
let storedRefreshToken: string | null = null;

export function getRefreshToken(): string | null {
  return storedRefreshToken;
}

export async function refreshAccessToken(scopes: string[]): Promise<{ accessToken: string; account: AccountInfo } | null> {
  if (!storedRefreshToken) return null;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: storedRefreshToken,
    scope: scopes.join(' '),
  });

  const tauriFetch = await getTauriFetch();
  const res = await tauriFetch(`${AUTHORITY}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    console.error('[auth] Refresh token exchange failed:', await res.text());
    storedRefreshToken = null;
    return null;
  }

  const tokens: TokenResponse = await res.json();
  if (tokens.refresh_token) {
    storedRefreshToken = tokens.refresh_token;
  }

  const claims = parseIdToken(tokens.id_token);
  return { accessToken: tokens.access_token, account: buildAccountInfo(claims) };
}

export async function tauriSignIn(): Promise<{ account: AccountInfo; accessToken: string } | null> {
  const port: number = await invoke('start_oauth_server');
  const redirectUri = `http://localhost:${port}`;
  const { verifier, challenge } = await generatePkce();

  const scopes = loginRequest.scopes.join(' ');
  const state = crypto.randomUUID();
  const authUrl = [
    `${AUTHORITY}/oauth2/v2.0/authorize`,
    `?client_id=${encodeURIComponent(CLIENT_ID)}`,
    `&response_type=code`,
    `&redirect_uri=${encodeURIComponent(redirectUri)}`,
    `&response_mode=query`,
    `&scope=${encodeURIComponent(`${scopes} offline_access`)}`,
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
          const tokens = await exchangeCodeForTokens(event.payload, redirectUri, verifier);
          const claims = parseIdToken(tokens.id_token);
          const account = buildAccountInfo(claims);

          if (tokens.refresh_token) {
            storedRefreshToken = tokens.refresh_token;
          }

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
