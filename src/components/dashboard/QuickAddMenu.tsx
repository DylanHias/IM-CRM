'use client';

import { useState, type ComponentProps, type ReactElement } from 'react';
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
import { useUIStore } from '@/store/uiStore';

export type QuickAddTarget = 'activity' | 'followup';

const LABELS: Record<QuickAddTarget, string> = {
  activity: 'Log Activity',
  followup: 'New Follow-up',
};

interface DialogProps {
  target: QuickAddTarget | null;
  onClose: () => void;
}

/** Asks for a customer, then opens the new-activity or new-follow-up form for it. */
export function QuickAddDialog({ target, onClose }: DialogProps) {
  const router = useRouter();
  const customers = useCustomerStore((s) => s.customers);
  const [customerId, setCustomerId] = useState('');

  const options = customers
    .map((c) => ({ value: c.id, label: c.name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const close = () => {
    setCustomerId('');
    onClose();
  };

  const proceed = () => {
    if (!customerId || !target) return;
    const path = target === 'activity' ? '/activities/new' : '/followups/new';
    router.push(`${path}?customerId=${customerId}`);
    close();
  };

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>{target ? LABELS[target] : ''}</DialogTitle>
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
  );
}

interface ButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {
  target: QuickAddTarget;
}

/** A button that opens the customer picker for one quick-add target. */
export function QuickAddButton({ target, ...props }: ButtonProps) {
  const [open, setOpen] = useState<QuickAddTarget | null>(null);
  return (
    <>
      <Button {...props} onClick={() => setOpen(target)} />
      <QuickAddDialog target={open} onClose={() => setOpen(null)} />
    </>
  );
}

interface Props {
  trigger?: ReactElement;
  align?: 'start' | 'end';
}

export function QuickAddMenu({ trigger, align = 'end' }: Props) {
  const router = useRouter();
  const [target, setTarget] = useState<QuickAddTarget | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger ?? (
            <Button size="sm" className="gap-1.5">
              <Plus size={13} />
              Quick add
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-48">
          <DropdownMenuItem onSelect={() => setTarget('activity')}>
            <ActivityIcon size={14} className="mr-2" /> Log activity
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setTarget('followup')}>
            <CalendarClock size={14} className="mr-2" /> New follow-up
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              useUIStore.getState().requestNewOpportunity();
              router.push('/opportunities');
            }}
          >
            <Crosshair size={14} className="mr-2" /> New opportunity
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <QuickAddDialog target={target} onClose={() => setTarget(null)} />
    </>
  );
}
