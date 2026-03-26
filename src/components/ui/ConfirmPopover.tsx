'use client';

import * as React from 'react';
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ConfirmPopoverProps {
  children: React.ReactNode;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  variant?: 'destructive' | 'default';
}

export function ConfirmPopover({
  children,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  side = 'bottom',
  align = 'end',
  variant = 'destructive',
}: ConfirmPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-64">
        <div className="flex items-start gap-2">
          <AlertTriangle size={16} className="text-warning flex-shrink-0 mt-0.5" />
          <p className="text-[13px] leading-snug">{message}</p>
        </div>
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant={variant}
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => {
              setOpen(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
