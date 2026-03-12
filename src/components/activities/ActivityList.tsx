'use client';

import { Plus, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ActivityItem } from './ActivityItem';
import type { Activity, Contact } from '@/types/entities';
import { useRouter } from 'next/navigation';

interface ActivityListProps {
  activities: Activity[];
  contacts: Contact[];
  customerId: string;
}

export function ActivityList({ activities, contacts, customerId }: ActivityListProps) {
  const router = useRouter();
  const sorted = [...activities].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  const getContactName = (contactId: string | null) => {
    if (!contactId) return undefined;
    const contact = contacts.find((c) => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : undefined;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Activities ({activities.length})</h3>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          onClick={() => router.push(`/activities/new?customerId=${customerId}`)}
        >
          <Plus size={13} />
          Log Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Inbox size={28} className="text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No activities yet</p>
          <p className="text-xs text-muted-foreground mt-0.5">Log the first interaction with this customer</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg px-4 divide-y">
          {sorted.map((a) => (
            <ActivityItem key={a.id} activity={a} contactName={getContactName(a.contactId)} />
          ))}
        </div>
      )}
    </div>
  );
}
