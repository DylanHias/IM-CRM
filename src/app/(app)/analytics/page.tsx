'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Analytics is now the Pipeline, Accounts and Activity tabs of Reports. */
export default function AnalyticsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/revenue-overview?tab=pipeline');
  }, [router]);
  return null;
}
