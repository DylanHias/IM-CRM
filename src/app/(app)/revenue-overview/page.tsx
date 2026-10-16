'use client';

import { Suspense } from 'react';
import { ReportsPage } from '@/components/reports/ReportsPage';

export default function RevenueOverviewPage() {
  return (
    <Suspense>
      <ReportsPage />
    </Suspense>
  );
}
