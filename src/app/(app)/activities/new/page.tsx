'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { sectionReveal } from '@/lib/motion';
import { ActivityForm } from '@/components/activities/ActivityForm';
import { useCustomerStore } from '@/store/customerStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { queryContactsByCustomer } from '@/lib/db/queries/contacts';
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
          setContacts(data);
        }
      } catch (err) {
        console.error('[activity] Failed to load contacts:', err);
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
    <motion.div className="max-w-2xl mx-auto" {...sectionReveal(0)}>
      <h2 className="text-xl font-semibold text-foreground mb-6">Log Activity</h2>
      <ActivityForm customerId={customerId} customerName={customer.name} contacts={contacts} />
    </motion.div>
  );
}

export default function NewActivityPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-muted-foreground">Loading...</div>}>
      <NewActivityContent />
    </Suspense>
  );
}
