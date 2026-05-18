'use client';

import { useCustomers } from '@/hooks/useCustomers';
import { InsightsPageContent } from '@/components/insights/InsightsPageContent';

export default function InsightsPage() {
  useCustomers();
  return <InsightsPageContent />;
}
