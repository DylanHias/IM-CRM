import { type Configuration, LogLevel } from '@azure/msal-browser';

function getRedirectUri(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ?? '',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID ?? 'common'}`,
    redirectUri: getRedirectUri(),
    postLogoutRedirectUri: getRedirectUri(),
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error) console.error('[MSAL]', message);
      },
    },
  },
};

export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile'],
};

export const d365Request = {
  scopes: [
    `${process.env.NEXT_PUBLIC_D365_BASE_URL ?? 'https://org.crm4.dynamics.com'}/.default`,
  ],
};

export const graphRequest = {
  scopes: ['https://graph.microsoft.com/Sites.ReadWrite.All'],
};
