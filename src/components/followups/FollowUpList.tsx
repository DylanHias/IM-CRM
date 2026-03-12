'use client';

import { Plus, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FollowUpItem } from './FollowUpItem';
import type { FollowUp } from '@/types/entities';
import { useRouter } from 'next/navigation';

interface FollowUpListProps {
  followUps: FollowUp[];
  customerId: string;
  onComplete: (id: string) => void;
}

export function FollowUpList({ followUps, customerId, onComplete }: FollowUpListProps) {
  const router = useRouter();
  const byDate = (a: FollowUp, b: FollowUp) => b.dueDate.localeCompare(a.dueDate);
  const open = followUps.filter((f) => !f.completed).sort(byDate);
  const done = followUps.filter((f) => f.completed).sort(byDate);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">
          Follow-Ups ({open.length} open)
        </h3>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs"
          onClick={() => router.push(`/followups/new?customerId=${customerId}`)}
        >
          <Plus size={13} />
          Add Follow-Up
        </Button>
      </div>

      {followUps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <CheckSquare size={28} className="text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No follow-ups yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {open.length > 0 && (
            <div className="bg-white border rounded-lg px-4 divide-y">
              {open.map((f) => (
                <FollowUpItem key={f.id} followUp={f} onComplete={onComplete} />
              ))}
            </div>
          )}
          {done.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Completed ({done.length})</p>
              <div className="bg-white border rounded-lg px-4 divide-y">
                {done.map((f) => (
                  <FollowUpItem key={f.id} followUp={f} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
