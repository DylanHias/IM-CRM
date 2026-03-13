'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMsal } from '@azure/msal-react';

export default function RootPage() {
  const router = useRouter();
  const { accounts, inProgress } = useMsal();

  useEffect(() => {
    if (inProgress !== 'none') return;
    if (accounts.length > 0) {
      router.replace('/customers');
    } else {
      router.replace('/login');
    }
  }, [accounts, inProgress, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
