'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { FollowUpForm } from '@/components/followups/FollowUpForm';
import { useCustomerStore } from '@/store/customerStore';

function NewFollowUpContent() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId') ?? '';
  const activityId = searchParams.get('activityId') ?? undefined;
  const { customers } = useCustomerStore();
  const customer = customers.find((c) => c.id === customerId);

  if (!customerId || !customer) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No customer selected.
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Create Follow-Up</h2>
      <FollowUpForm customerId={customerId} customerName={customer.name} activityId={activityId} />
    </div>
  );
}

export default function NewFollowUpPage() {
  return (
    <AuthGuard>
      <AppShell>
        <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Loading...</div>}>
          <NewFollowUpContent />
        </Suspense>
      </AppShell>
    </AuthGuard>
  );
}
