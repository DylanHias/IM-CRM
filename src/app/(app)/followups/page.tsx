'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FollowUpItem } from '@/components/followups/FollowUpItem';
import { Badge } from '@/components/ui/badge';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { mockFollowUps } from '@/lib/mock/followups';
import { mockCustomers } from '@/lib/mock/customers';
import { queryAllFollowUps, completeFollowUp } from '@/lib/db/queries/followups';
import { queryAllCustomers } from '@/lib/db/queries/customers';
import type { FollowUp } from '@/types/entities';
import { useFollowUpStore } from '@/store/followUpStore';

export default function FollowUpsPage() {
  const router = useRouter();
  const { markComplete } = useFollowUpStore();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [customerMap, setCustomerMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const load = async () => {
      try {
        if (isTauriApp()) {
          const [fups, customers] = await Promise.all([
            queryAllFollowUps(),
            queryAllCustomers(),
          ]);
          setFollowUps(fups.length > 0 ? fups : mockFollowUps);
          setCustomerMap(new Map((customers.length > 0 ? customers : mockCustomers).map((c) => [c.id, c.name])));
        } else {
          setFollowUps(mockFollowUps);
          setCustomerMap(new Map(mockCustomers.map((c) => [c.id, c.name])));
        }
      } catch {
        setFollowUps(mockFollowUps);
        setCustomerMap(new Map(mockCustomers.map((c) => [c.id, c.name])));
      }
    };
    load();
  }, []);

  const handleComplete = async (id: string) => {
    if (isTauriApp()) {
      await completeFollowUp(id);
    }
    markComplete(id);
    setFollowUps((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, completed: true, completedAt: new Date().toISOString() } : f
      )
    );
  };

  const today = new Date().toISOString().split('T')[0];
  const overdue = followUps.filter((f) => !f.completed && f.dueDate < today);
  const upcoming = followUps.filter((f) => !f.completed && f.dueDate >= today);
  const done = followUps.filter((f) => f.completed).slice(0, 10);

  const getCustomerName = (customerId: string) =>
    customerMap.get(customerId) ?? customerId;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">All Follow-Ups</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Track open tasks and next actions across all customers.
            </p>
          </div>

          {overdue.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-destructive">Overdue</h3>
                <Badge variant="destructive">{overdue.length}</Badge>
              </div>
              <div className="bg-card rounded-xl px-4 divide-y divide-border/70 shadow-sm border-l-4 border-l-destructive/60 border border-border/60">
                {overdue.map((f) => (
                  <div key={f.id}>
                    <p className="text-xs text-muted-foreground pt-2 cursor-pointer hover:underline" onClick={() => router.push(`/customers/${f.customerId}`)}>
                      {getCustomerName(f.customerId)}
                    </p>
                    <FollowUpItem followUp={f} onComplete={handleComplete} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">Upcoming ({upcoming.length})</h3>
              <div className="bg-card rounded-xl px-4 divide-y divide-border/70 shadow-sm border border-border/60">
                {upcoming.map((f) => (
                  <div key={f.id}>
                    <p className="text-xs text-muted-foreground pt-2 cursor-pointer hover:underline" onClick={() => router.push(`/customers/${f.customerId}`)}>
                      {getCustomerName(f.customerId)}
                    </p>
                    <FollowUpItem followUp={f} onComplete={handleComplete} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Recently Completed</h3>
              <div className="bg-card rounded-xl px-4 divide-y divide-border/70 shadow-sm border border-border/60">
                {done.map((f) => (
                  <FollowUpItem key={f.id} followUp={f} />
                ))}
              </div>
            </section>
          )}
    </div>
  );
}
