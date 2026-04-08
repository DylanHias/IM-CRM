import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// --- Mock Tauri plugins ---
vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn().mockResolvedValue({
      execute: vi.fn().mockResolvedValue({ rowsAffected: 0, lastInsertId: 0 }),
      select: vi.fn().mockResolvedValue([]),
    }),
  },
}));

vi.mock('@tauri-apps/api', () => ({}));
vi.mock('@tauri-apps/plugin-updater', () => ({
  check: vi.fn().mockResolvedValue(null),
}));
vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch: vi.fn(),
}));
vi.mock('@tauri-apps/plugin-fs', () => ({
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
}));

// --- Mock next/navigation ---
const mockRouter = {
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  forward: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// --- Mock MSAL ---
vi.mock('@azure/msal-browser', () => ({
  PublicClientApplication: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getAllAccounts: vi.fn().mockReturnValue([]),
    acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
    loginPopup: vi.fn().mockResolvedValue({ account: null, accessToken: '' }),
    logoutPopup: vi.fn().mockResolvedValue(undefined),
    setActiveAccount: vi.fn(),
  })),
  InteractionRequiredAuthError: class InteractionRequiredAuthError extends Error {
    constructor(message?: string) {
      super(message);
      this.name = 'InteractionRequiredAuthError';
    }
  },
  EventType: {},
  LogLevel: { Error: 0, Warning: 1, Info: 2, Verbose: 3, Trace: 4 },
}));

vi.mock('@azure/msal-react', () => ({
  MsalProvider: ({ children }: { children: React.ReactNode }) => children,
  useMsal: () => ({
    instance: {
      getAllAccounts: vi.fn().mockReturnValue([]),
      acquireTokenSilent: vi.fn().mockResolvedValue({ accessToken: 'mock-token' }),
    },
    accounts: [],
  }),
  useIsAuthenticated: () => false,
}));

// --- Mock window.matchMedia ---
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// --- Reset Zustand stores between tests ---
const storeResetFns = new Set<() => void>();

export function registerStoreReset(fn: () => void) {
  storeResetFns.add(fn);
}

beforeEach(() => {
  storeResetFns.forEach((fn) => fn());
});

// Export mockRouter for use in tests
export { mockRouter };
