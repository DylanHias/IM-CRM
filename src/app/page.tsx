'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMsal } from '@azure/msal-react';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function RootPage() {
  const router = useRouter();
  const { accounts, inProgress } = useMsal();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const defaultLandingTab = useSettingsStore((s) => s.defaultLandingTab);
  const sidebarHiddenTabs = useSettingsStore((s) => s.sidebarHiddenTabs);

  useEffect(() => {
    if (inProgress !== 'none') return;
    if (accounts.length > 0 || isAuthenticated) {
      const target = sidebarHiddenTabs.includes(defaultLandingTab) ? '/dashboard' : defaultLandingTab;
      router.replace(target);
    } else {
      router.replace('/login');
    }
  }, [accounts, inProgress, router, isAuthenticated, defaultLandingTab, sidebarHiddenTabs]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
