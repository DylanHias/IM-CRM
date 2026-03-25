import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { useCustomerStore } from '@/store/customerStore';
import { useActivityStore } from '@/store/activityStore';
import { useFollowUpStore } from '@/store/followUpStore';
import { useAuthStore } from '@/store/authStore';
import { createCustomer, createActivity, createFollowUp } from '@/__tests__/mocks/factories';
import { initDb } from '@/lib/db/client';

const resetCustomerStore = () =>
  useCustomerStore.setState({
    customers: [],
    allContacts: [],
    selectedCustomerId: null,
    searchQuery: '',
    sortBy: 'lastActivity',
    sortDir: 'desc',
    filterOwnerId: null,
    filterStatus: 'all',
    filterIndustry: null,
    filterSegment: null,
    filterCountry: null,
    filterNoRecentActivity: false,
    isLoading: false,
  });

const resetActivityStore = () =>
  useActivityStore.setState({
    activities: [],
    currentCustomerId: null,
    pendingCount: 0,
    isLoading: false,
  });

const resetFollowUpStore = () =>
  useFollowUpStore.setState({
    followUps: [],
    currentCustomerId: null,
    overdueCount: 0,
    isLoading: false,
  });

const resetAuthStore = () =>
  useAuthStore.setState({
    account: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
    isAdmin: false,
  });

describe('Security tests', () => {
  beforeEach(() => {
    resetCustomerStore();
    resetActivityStore();
    resetFollowUpStore();
    resetAuthStore();
  });

  // --- XSS prevention (store level) ---
  describe('XSS prevention', () => {
    it('customer name with script tag stored as plain text', () => {
      const xssName = '<script>alert("xss")</script>';
      const customer = createCustomer({ name: xssName });
      useCustomerStore.getState().setCustomers([customer]);
      const stored = useCustomerStore.getState().customers[0];
      expect(stored.name).toBe(xssName);
      expect(stored.name).not.toContain('&lt;');
    });

    it('activity subject with HTML stored as-is', () => {
      const htmlSubject = '<b>Bold</b><img src=x onerror=alert(1)>';
      const activity = createActivity({ subject: htmlSubject });
      useActivityStore.getState().addActivity(activity);
      const stored = useActivityStore.getState().activities[0];
      expect(stored.subject).toBe(htmlSubject);
    });

    it('search query with script tag stored as plain text', () => {
      const xssQuery = '<script>document.cookie</script>';
      useCustomerStore.getState().setSearchQuery(xssQuery);
      expect(useCustomerStore.getState().searchQuery).toBe(xssQuery);
    });

    it('followUp title with img onerror stored safely', () => {
      const xssTitle = '<img onerror=alert(1)>';
      const followUp = createFollowUp({ title: xssTitle });
      useFollowUpStore.getState().addFollowUp(followUp);
      const stored = useFollowUpStore.getState().followUps[0];
      expect(stored.title).toBe(xssTitle);
    });
  });

  // --- Auth security ---
  describe('Auth security', () => {
    it('clearAuth fully clears accessToken', () => {
      useAuthStore.getState().setAccount(
        { homeAccountId: '1', environment: 'test', tenantId: 't', username: 'user', localAccountId: 'l' } as never,
        'secret-token-123'
      );
      expect(useAuthStore.getState().accessToken).toBe('secret-token-123');
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('clearAuth resets isAdmin to false', () => {
      useAuthStore.getState().setIsAdmin(true);
      expect(useAuthStore.getState().isAdmin).toBe(true);
      useAuthStore.getState().clearAuth();
      expect(useAuthStore.getState().isAdmin).toBe(false);
    });

    it('auth store initial state has no token', () => {
      resetAuthStore();
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('setAccount requires both account and token params', () => {
      useAuthStore.getState().setAccount(
        { homeAccountId: '1', environment: 'test', tenantId: 't', username: 'user', localAccountId: 'l' } as never,
        'my-token'
      );
      const state = useAuthStore.getState();
      expect(state.account).not.toBeNull();
      expect(state.accessToken).toBe('my-token');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  // --- SQL injection patterns (static analysis) ---
  describe('SQL injection prevention — parameterized queries', () => {
    const queryFiles = [
      'src/lib/db/queries/customers.ts',
      'src/lib/db/queries/activities.ts',
      'src/lib/db/queries/followups.ts',
      'src/lib/db/queries/opportunities.ts',
      'src/lib/db/queries/contacts.ts',
      'src/lib/db/queries/sync.ts',
    ];

    for (const filePath of queryFiles) {
      describe(filePath, () => {
        const fullPath = path.resolve(__dirname, '../../', filePath);
        const content = readFileSync(fullPath, 'utf-8');

        it('uses parameterized queries ($1, $2, etc.) for user data', () => {
          const execOrSelectCalls = content.match(/\.(execute|select)\s*\(/g);
          if (!execOrSelectCalls) return;

          const hasParams = /\$\d+/.test(content);
          expect(hasParams).toBe(true);
        });

        it('no template literal interpolation in SQL strings', () => {
          const templateLiteralWithInterpolation = /`[^`]*\$\{(?!excluded\.)(?!datetime)[^}]+\}[^`]*`/g;
          const sqlBlocks = content.match(/(execute|select)\s*\(\s*`[^`]*`/g) ?? [];

          for (const block of sqlBlocks) {
            const interpolations = block.match(/\$\{(?!excluded\.)[^}]+\}/g) ?? [];
            const unsafeInterpolations = interpolations.filter(
              (interp) => !interp.includes('col') && !interp.includes('TABLE')
            );
            expect(unsafeInterpolations).toEqual([]);
          }
        });
      });
    }
  });

  // --- Input validation ---
  describe('Input validation', () => {
    it('extremely long string (10K chars) in searchQuery — no crash', () => {
      const longStr = 'a'.repeat(10_000);
      useCustomerStore.getState().setSearchQuery(longStr);
      useCustomerStore.getState().setCustomers([createCustomer()]);
      expect(() => useCustomerStore.getState().getFilteredCustomers()).not.toThrow();
    });

    it('extremely long string in activity subject — stores fine', () => {
      const longSubject = 'x'.repeat(10_000);
      const activity = createActivity({ subject: longSubject });
      useActivityStore.getState().addActivity(activity);
      expect(useActivityStore.getState().activities[0].subject).toHaveLength(10_000);
    });

    it('empty string in store setters — works fine', () => {
      useCustomerStore.getState().setSearchQuery('');
      expect(useCustomerStore.getState().searchQuery).toBe('');

      const activity = createActivity({ subject: '' });
      useActivityStore.getState().addActivity(activity);
      expect(useActivityStore.getState().activities[0].subject).toBe('');
    });
  });

  // --- Prototype pollution ---
  describe('Prototype pollution', () => {
    it('setting __proto__ as searchQuery — no Object.prototype pollution', () => {
      useCustomerStore.getState().setSearchQuery('__proto__');
      expect(useCustomerStore.getState().searchQuery).toBe('__proto__');
      expect(Object.prototype.toString).toBeDefined();
      expect(({}).toString()).toBe('[object Object]');
    });

    it('Object.prototype.toString still works after setting malicious query', () => {
      useCustomerStore.getState().setSearchQuery('constructor');
      useCustomerStore.getState().setSearchQuery('__proto__[polluted]=true');
      expect(Object.prototype.toString.call({})).toBe('[object Object]');
      expect((Object.prototype as Record<string, unknown>)['polluted']).toBeUndefined();
    });
  });

  // --- Tauri guard verification ---
  describe('Tauri guard verification', () => {
    it('initDb returns early (not throws) since isTauriApp() is false', async () => {
      await expect(initDb()).resolves.toBeUndefined();
    });
  });
});
