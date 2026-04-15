'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckSquare, Check, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomerStore } from '@/store/customerStore';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { emitDataEvent } from '@/lib/dataEvents';
import { cn } from '@/lib/utils';
import type { FollowUp } from '@/types/entities';

interface Props {
  followUps: FollowUp[];
  onCompleted: (id: string) => void;
}

export function TodayFollowUpsCard({ followUps, onCompleted }: Props) {
  const router = useRouter();
  const customers = useCustomerStore((s) => s.customers);
  const [completing, setCompleting] = useState<string | null>(null);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? '';

  const handleComplete = async (followUp: FollowUp) => {
    if (!isTauriApp()) return;
    setCompleting(followUp.id);
    try {
      const { completeFollowUp } = await import('@/lib/db/queries/followups');
      await completeFollowUp(followUp.id);
      emitDataEvent('followup', 'completed', followUp.customerId);
      onCompleted(followUp.id);
    } catch (err) {
      console.error('[followup] Failed to complete follow-up:', err);
    } finally {
      setCompleting(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CheckSquare size={14} className="text-muted-foreground" />
          Due Today
          {followUps.length > 0 && (
            <span className="ml-auto text-xs font-normal text-muted-foreground">{followUps.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {followUps.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nothing due today.</p>
        ) : (
          <ul className="space-y-1.5">
            {followUps.map((f) => (
              <li key={f.id} className="flex items-start gap-2.5 group">
                <button
                  onClick={() => handleComplete(f)}
                  disabled={completing === f.id}
                  className={cn(
                    'mt-0.5 shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                    completing === f.id
                      ? 'border-primary bg-primary'
                      : 'border-border group-hover:border-primary',
                  )}
                >
                  {completing === f.id && <Check size={9} className="text-primary-foreground" />}
                  {completing !== f.id && <Circle size={8} className="opacity-0 group-hover:opacity-30 text-primary" />}
                </button>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => router.push(`/customers?id=${f.customerId}&tab=followups`)}
                >
                  <p className="text-sm font-medium truncate leading-snug">{f.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{customerName(f.customerId)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
