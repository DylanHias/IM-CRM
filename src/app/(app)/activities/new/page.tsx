'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
      try {
        if (isTauriApp()) {
          const data = await queryContactsByCustomer(customerId);
          setContacts(data.length > 0 ? data : mockContacts.filter((c) => c.customerId === customerId));
        } else {
          setContacts(mockContacts.filter((c) => c.customerId === customerId));
        }
      } catch {
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
      <h2 className="text-xl font-semibold text-foreground mb-6">Log Activity</h2>
      <ActivityForm customerId={customerId} customerName={customer.name} contacts={contacts} />
    </div>
  );
}

export default function NewActivityPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Loading...</div>}>
      <NewActivityContent />
    </Suspense>
  );
}
