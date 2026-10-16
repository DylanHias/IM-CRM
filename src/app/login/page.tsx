'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMsal } from '@azure/msal-react';
import { AlertCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import type { AccountInfo } from '@azure/msal-browser';
import { signIn } from '@/lib/auth/authHelpers';
import { loadProfilePhoto } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useAuthStore } from '@/store/authStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { WindowFrame } from '@/components/layout/WindowFrame';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';
const SHOW_DEV_BYPASS = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

/** Flowing accent lines behind the login copy; purely decorative. */
function LoginArt() {
  const lines = Array.from({ length: 14 }, (_, k) => {
    const y = 80 + k * 46;
    return (
      <path
        key={k}
        d={`M-40 ${y + 240}C${220 + k * 12} ${y + 120} ${420 - k * 8} ${y - 60} 880 ${y - 180 - k * 6}`}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeOpacity={0.05 + (k % 5) * 0.025}
        strokeWidth={1 + (k % 3) * 0.6}
      />
    );
  });
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {lines}
      <circle cx="640" cy="210" r="120" fill="hsl(var(--primary))" fillOpacity={0.06} />
      <circle cx="640" cy="210" r="64" fill="hsl(var(--primary))" fillOpacity={0.1} />
      <circle cx="640" cy="210" r="22" fill="hsl(var(--primary))" fillOpacity={0.55} />
      <circle cx="190" cy="560" r="10" fill="hsl(var(--primary))" fillOpacity={0.35} />
      <circle cx="420" cy="380" r="6" fill="hsl(var(--primary))" fillOpacity={0.35} />
    </svg>
  );
}

const MicrosoftMark = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden>
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

const stagger = (i: number) => ({ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' as const });
const rise = 'animate-in fade-in slide-in-from-bottom-2 duration-500';

export default function LoginPage() {
  const router = useRouter();
  const { accounts } = useMsal();
  const { setAccount } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOnline = useOnlineStatus();

  // Already logged in?
  useEffect(() => {
    if (accounts.length > 0 || isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [accounts, router, isAuthenticated]);

  const handleDevBypass = async () => {
    setAccount(
      {
        homeAccountId: 'dev-mock-id',
        environment: 'login.microsoftonline.com',
        tenantId: 'dev-tenant',
        username: 'dev@ingrammicro.com',
        localAccountId: 'dev-local-id',
        name: 'Dev User',
        idTokenClaims: {},
        nativeAccountId: undefined,
        authorityType: 'MSSTS',
      } as unknown as AccountInfo,
      'mock-dev-token'
    );
    useAuthStore.getState().setIsAdmin(true);

    // DB sync is best-effort — don't block login if it fails
    if (isTauriApp()) {
      try {
        const { upsertUser, isUserAdmin, updateUserRole } = await import('@/lib/db/queries/users');
        const now = new Date().toISOString();
        await upsertUser({
          id: 'dev-local-id',
          email: 'dev@ingrammicro.com',
          name: 'Dev User',
          role: 'admin',
          businessUnit: null,
          title: null,
          lastActiveAt: now,
          profilePhoto: null,
          analyticsTracked: false,
          createdAt: now,
          updatedAt: now,
        });
        const admin = await isUserAdmin('dev-local-id');
        if (!admin) await updateUserRole('dev-local-id', 'admin');
      } catch (err) {
        console.error('[login] Dev bypass DB sync failed (non-fatal):', err);
      }
    }

    router.replace('/dashboard');
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn();
      if (result) {
        setAccount(result.account, result.accessToken);

        // Sync user to DB and check admin status
        if (isTauriApp() && result.account.localAccountId) {
          // Default to the MSAL id; resolve to the D365-keyed row below so profile
          // reads/writes target the same row the birthday/profile data lives on.
          let dbId = result.account.localAccountId;
          try {
            const { upsertUser, isUserAdmin, isHardcodedAdmin, queryD365UserIdByEmail, touchUserLastActive } =
              await import('@/lib/db/queries/users');
            const now = new Date().toISOString();
            const email = result.account.username ?? '';
            const role = isHardcodedAdmin(email) ? 'admin' : 'user';
            // Reuse the existing D365-synced row when one shares this email — creating a
            // second MSAL-keyed row would split profile data across two ids.
            const existingId = email ? await queryD365UserIdByEmail(email) : null;
            if (existingId) {
              dbId = existingId;
              await touchUserLastActive(existingId, now);
            } else {
              await upsertUser({
                id: result.account.localAccountId,
                email,
                name: result.account.name ?? 'Unknown',
                role,
                businessUnit: null,
                title: null,
                lastActiveAt: now,
                profilePhoto: null,
                analyticsTracked: false,
                createdAt: now,
                updatedAt: now,
              });
            }
            const admin = await isUserAdmin(dbId);
            useAuthStore.getState().setIsAdmin(admin);
          } catch (dbErr) {
            console.error('[login] DB user sync failed (non-fatal):', dbErr);
          }
          await loadProfilePhoto(dbId);
        }

        router.replace('/dashboard');
      } else {
        setError('Login was cancelled or failed. Please try again.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error('[login]', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <WindowFrame />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(340px,420px)_minmax(0,1fr)] max-[760px]:grid-cols-1">
        <div className="flex min-h-0 flex-col overflow-auto border-r border-border bg-card px-10 pb-[18px] pt-7 max-[760px]:border-r-0 max-[760px]:p-6">
          <div className="flex items-center gap-2.5 text-sm">
            <Image src="/images/icon.png" alt="" width={28} height={28} className="rounded-md" />
            <b className="font-semibold">Ingram Micro CRM</b>
          </div>

          <div className="flex max-w-[320px] flex-1 flex-col justify-center gap-3.5 py-6">
            <h1 className={`text-2xl font-semibold tracking-[-0.02em] ${rise}`} style={stagger(0)}>Sign in</h1>
            <p className={`-mt-2 text-[13px] text-muted-foreground ${rise}`} style={stagger(1)}>Use your Ingram Micro work account.</p>

            {error && (
              <div role="alert" className={`flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[13px] text-destructive ${rise}`}>
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span className="break-words">{error}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoading}
              className={`flex h-[41px] w-full items-center justify-center gap-3 border border-[#8c8c8c] bg-white text-[15px] font-semibold text-[#5e5e5e] transition-colors [font-family:'Segoe_UI',var(--font-geist-sans)] hover:bg-[#f3f3f3] disabled:text-[#8c8c8c] dark:border-[#2f2f2f] dark:bg-[#2f2f2f] dark:text-white dark:hover:bg-[#3a3a3a] ${rise}`}
              style={stagger(2)}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <MicrosoftMark />}
              {isLoading ? 'Signing in…' : 'Sign in with Microsoft'}
            </button>
            {isLoading && <p className="text-[13px] text-muted-foreground">Finish signing in in the Microsoft window.</p>}

            {SHOW_DEV_BYPASS && (
              <button type="button" onClick={handleDevBypass} className="self-start text-xs text-faint underline-offset-2 hover:text-foreground hover:underline">
                Skip login (dev only)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11.5px] text-faint">
            <span>v{APP_VERSION}</span>
            <span className="flex-1" />
            <span className="inline-flex items-center gap-1">
              {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="relative grid content-end overflow-hidden p-10 animate-in fade-in duration-700 max-[760px]:hidden" aria-hidden>
          <LoginArt />
          <div className="relative grid max-w-[380px] gap-1">
            <b className="text-[22px] font-semibold tracking-[-0.02em]">Field Sales CRM</b>
            <span className="text-[13.5px] text-muted-foreground">Customers, pipeline and follow-ups for the Benelux cloud team.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
