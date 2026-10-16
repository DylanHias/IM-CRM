'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Insights is now the Revenue tab of Reports. */
export default function InsightsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/revenue-overview');
  }, [router]);
  return null;
}
