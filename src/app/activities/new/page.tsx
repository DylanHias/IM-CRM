'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ActivityForm } from '@/components/activities/ActivityForm';
import { useCustomerStore } from '@/store/customerStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryContactsByCustomer } from '@/lib/db/queries/contacts';
import { mockContacts } from '@/lib/mock/contacts';
import type { Contact } from '@/types/entities';

function NewActivityContent() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId') ?? '';
  const { customers } = useCustomerStore();
  const customer = customers.find((c) => c.id === customerId);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (!customerId) return;
    const load = async () => {
      if (isTauriApp()) {
        const data = await queryContactsByCustomer(customerId);
        setContacts(data);
      } else {
        setContacts(mockContacts.filter((c) => c.customerId === customerId));
      }
    };
    load();
  }, [customerId]);

  if (!customerId || !customer) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No customer selected.
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold text-slate-900 mb-6">Log Activity</h2>
      <ActivityForm customerId={customerId} customerName={customer.name} contacts={contacts} />
    </div>
  );
}

export default function NewActivityPage() {
  return (
    <AuthGuard>
      <AppShell title="Log Activity">
        <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Loading...</div>}>
          <NewActivityContent />
        </Suspense>
      </AppShell>
    </AuthGuard>
  );
}
