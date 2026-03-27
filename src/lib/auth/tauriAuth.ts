import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open } from '@tauri-apps/plugin-shell';
import { getMsalInstance } from './msalInstance';
import { loginRequest } from './msalConfig';
import type { AccountInfo } from '@azure/msal-browser';

const CLIENT_ID = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ?? '';
const TENANT_ID = process.env.NEXT_PUBLIC_AZURE_TENANT_ID ?? 'common';
const AUTHORITY = `https://login.microsoftonline.com/${TENANT_ID}`;

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
      unlistenCallback = await listen<string>('oauth://callback', async (event) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);

        try {
          const instance = getMsalInstance();
          const result = await instance.acquireTokenByCode({
            code: event.payload,
            codeVerifier: verifier,
            redirectUri,
            scopes: loginRequest.scopes,
          });

          if (result.account) {
            instance.setActiveAccount(result.account);
            await cleanup();
            resolve({ account: result.account, accessToken: result.accessToken });
          } else {
            await cleanup();
            resolve(null);
          }
        } catch (err) {
          await cleanup();
          reject(err);
        }
      });

      unlistenError = await listen<string>('oauth://error', async (event) => {
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
