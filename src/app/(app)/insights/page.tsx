'use client';

import { useCustomers } from '@/hooks/useCustomers';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { InsightsPageContent } from '@/components/insights/InsightsPageContent';

export default function InsightsPage() {
  useCustomers();
  return (
    <AdminGuard>
      <InsightsPageContent />
    </AdminGuard>
  );
}
