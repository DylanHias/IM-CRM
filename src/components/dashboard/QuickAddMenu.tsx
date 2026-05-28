'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity as ActivityIcon, CalendarClock, Crosshair, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCustomerStore } from '@/store/customerStore';

type QuickAddTarget = 'activity' | 'followup';

export function QuickAddMenu() {
  const router = useRouter();
  const customers = useCustomerStore((s) => s.customers);
  const [target, setTarget] = useState<QuickAddTarget | null>(null);
  const [customerId, setCustomerId] = useState('');

  const options = customers
    .map((c) => ({ value: c.id, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const open = (t: QuickAddTarget) => {
    setCustomerId('');
    setTarget(t);
  };

  const close = () => setTarget(null);

  const proceed = () => {
    if (!customerId || !target) return;
    const path = target === 'activity' ? '/activities/new' : '/followups/new';
    router.push(`${path}?customerId=${customerId}`);
    close();
  };

  const labels: Record<QuickAddTarget, string> = {
    activity: 'Log Activity',
    followup: 'New Follow-up',
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <Plus size={13} />
            Quick add
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => open('activity')}>
            <ActivityIcon size={14} className="mr-2" /> Log activity
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => open('followup')}>
            <CalendarClock size={14} className="mr-2" /> New follow-up
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/opportunities?new=1')}>
            <Crosshair size={14} className="mr-2" /> New opportunity
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={target !== null} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{target ? labels[target] : ''}</DialogTitle>
          <DialogDescription>Pick a customer to continue.</DialogDescription>
          <div className="py-2">
            <Combobox
              options={options}
              value={customerId}
              onValueChange={setCustomerId}
              placeholder="Select customer…"
              searchPlaceholder="Search customers…"
              emptyText="No customers found."
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button size="sm" disabled={!customerId} onClick={proceed}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
