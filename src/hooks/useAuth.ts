'use client';

import { useEffect, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { useAuthStore } from '@/store/authStore';
import { loginRequest } from '@/lib/auth/msalConfig';
import { isTauriApp } from '@/lib/utils/offlineUtils';

export function useAuth() {
  const { instance, accounts, inProgress } = useMsal();
  const { setAccount, clearAuth, setIsAdmin, isAuthenticated, account } = useAuthStore();
  const restoredRef = useRef(false);

  useEffect(() => {
    if (inProgress !== 'none') return;

    // In Tauri, auth is handled by the custom OAuth server — skip MSAL token acquisition
    // entirely to prevent stale MSAL cache entries from triggering clearAuth()
    if (isTauriApp()) {
      if (!isAuthenticated && !restoredRef.current) {
        restoredRef.current = true;
        const tryRestore = async () => {
          try {
            const { restoreSession } = await import('@/lib/auth/authHelpers');
            const restored = await restoreSession();
            if (restored) {
              const restoredAccount = useAuthStore.getState().account;
              if (restoredAccount) {
                const dbId = await syncUserToDb(restoredAccount, setIsAdmin);
                if (dbId) await loadProfilePhoto(dbId);
              }
            } else {
              clearAuth();
            }
          } catch (err) {
            console.error('[auth] Session restore failed:', err);
            clearAuth();
          }
        };
        tryRestore();
      }
      return;
    }

    if (accounts.length > 0) {
      // MSAL has cached accounts (browser flow) — acquire token silently
      const acquireToken = async () => {
        try {
          const result = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
          setAccount(accounts[0], result.accessToken);
          const dbId = await syncUserToDb(accounts[0], setIsAdmin);
          if (dbId) await loadProfilePhoto(dbId);
        } catch (err) {
          console.error('[auth] Silent token acquisition failed:', err);
          clearAuth();
        }
      };
      acquireToken();
    } else if (!isAuthenticated && !restoredRef.current) {
      restoredRef.current = true;
      clearAuth();
    }
  }, [accounts, inProgress, instance, setAccount, clearAuth, setIsAdmin, isAuthenticated]);

  return { isAuthenticated, account, inProgress };
}

const PROFILE_LOAD_TTL_MS = 60 * 60 * 1000;
const inFlightProfileLoads = new Map<string, Promise<void>>();
const lastProfileLoadAt = new Map<string, number>();

export async function loadProfilePhoto(userId: string): Promise<void> {
  const existing = inFlightProfileLoads.get(userId);
  if (existing) return existing;

  const last = lastProfileLoadAt.get(userId);
  if (last && Date.now() - last < PROFILE_LOAD_TTL_MS) return;

  const run = doLoadProfilePhoto(userId).finally(() => {
    inFlightProfileLoads.delete(userId);
  });
  inFlightProfileLoads.set(userId, run);
  return run;
}

async function doLoadProfilePhoto(userId: string): Promise<void> {
  try {
    const { getProfilePhoto, saveProfilePhoto, getGraphProfile, saveGraphProfile } =
      await import('@/lib/db/queries/users');

    // 1. Hydrate from local DB cache immediately so the modal/sidebar can render without waiting on Graph.
    const [cachedPhoto, cachedProfile] = await Promise.all([
      getProfilePhoto(userId),
      getGraphProfile(userId),
    ]);
    if (cachedPhoto) useAuthStore.getState().setProfilePhoto(cachedPhoto);
    if (cachedProfile) {
      useAuthStore.getState().setUserProfile({
        ...cachedProfile,
        mobilePhone: null,
        businessPhones: [],
      });
    }

    // 2. Refresh from Graph only when something is actually missing.
    // Anything fresh in the DB cache survives until the next TTL window.
    const needsPhoto = !cachedPhoto;
    const needsProfile = !cachedProfile;
    if (!needsPhoto && !needsProfile) {
      lastProfileLoadAt.set(userId, Date.now());
      return;
    }

    const { fetchProfilePhoto, fetchUserProfile } = await import('@/lib/auth/graphApi');

    if (needsPhoto) {
      const photo = await fetchProfilePhoto();
      if (photo) {
        await saveProfilePhoto(userId, photo);
        useAuthStore.getState().setProfilePhoto(photo);
      }
    }

    if (needsProfile) {
      const fresh = await fetchUserProfile();
      if (fresh) {
        useAuthStore.getState().setUserProfile(fresh);
        await saveGraphProfile(userId, {
          jobTitle: fresh.jobTitle,
          country: fresh.country,
          city: fresh.city,
          officeLocation: fresh.officeLocation,
          birthday: fresh.birthday,
        });
      }
    }

    lastProfileLoadAt.set(userId, Date.now());
  } catch (err) {
    console.error('[auth] Profile load failed:', err);
  }
}

function normalizeDisplayName(raw: string | undefined): string {
  const name = (raw ?? '').trim();
  if (!name) return 'Unknown';
  // MSAL often returns "Last, First" — flip to "First Last" so it matches D365's fullname format.
  const commaIdx = name.indexOf(',');
  if (commaIdx > 0 && commaIdx < name.length - 1) {
    const last = name.slice(0, commaIdx).trim();
    const first = name.slice(commaIdx + 1).trim();
    if (first && last) return `${first} ${last}`;
  }
  return name;
}

async function syncUserToDb(
  account: { localAccountId?: string; username?: string; name?: string },
  setIsAdmin: (isAdmin: boolean) => void,
): Promise<string | null> {
  if (!isTauriApp() || !account.localAccountId) return account.localAccountId ?? null;
  try {
    const { upsertUser, isUserAdmin, isHardcodedAdmin, queryD365UserIdByEmail } = await import('@/lib/db/queries/users');
    const now = new Date().toISOString();
    const email = account.username ?? '';
    const role = isHardcodedAdmin(email) ? 'admin' : 'user';

    // If a row already exists for this email (e.g. previously synced from D365 with
    // a different systemuserid), just refresh its lastActiveAt — don't clobber the
    // D365-sourced business_unit/role/title with our MSAL placeholders.
    const existingId = email ? await queryD365UserIdByEmail(email) : null;
    if (existingId) {
      const { touchUserLastActive } = await import('@/lib/db/queries/users');
      await touchUserLastActive(existingId, now);
    } else {
      await upsertUser({
        id: account.localAccountId,
        email,
        name: normalizeDisplayName(account.name),
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
    const idToUse = existingId ?? account.localAccountId;
    const admin = await isUserAdmin(idToUse);
    setIsAdmin(admin);
    return idToUse;
  } catch (dbErr) {
    console.error('[auth] DB user sync failed (staying authenticated):', dbErr);
    return account.localAccountId ?? null;
  }
}
