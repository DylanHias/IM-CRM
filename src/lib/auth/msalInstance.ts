import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './msalConfig';

// Singleton MSAL instance — created once, shared across the app
let _msalInstance: PublicClientApplication | null = null;

export function getMsalInstance(): PublicClientApplication {
  if (!_msalInstance) {
    _msalInstance = new PublicClientApplication(msalConfig);
  }
  return _msalInstance;
}

// Initialized flag — initialize() must be called before acquireToken
let _initialized = false;

export async function initializeMsal(): Promise<PublicClientApplication> {
  const instance = getMsalInstance();
  if (!_initialized) {
    await instance.initialize();
    _initialized = true;
  }
  return instance;
}
