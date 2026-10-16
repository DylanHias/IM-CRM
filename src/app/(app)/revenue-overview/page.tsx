'use client';

import { Suspense } from 'react';
import { ReportsShell } from '@/components/reports/ReportsShell';

export default function RevenueOverviewPage() {
  return (
    <Suspense>
      <ReportsShell />
    </Suspense>
  );
}
