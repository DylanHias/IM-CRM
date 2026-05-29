'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { sideCannons, markBirthdayShown, pickBirthdayMessage } from '@/lib/easterEggs';

interface Props {
  open: boolean;
  firstName: string;
  onClose: () => void;
}

export function BirthdayModal({ open, firstName, onClose }: Props) {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!open) return;
    setMessage(pickBirthdayMessage());
    sideCannons(5000);
    markBirthdayShown();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="py-6 space-y-4">
          <div className="text-6xl select-none">🎂</div>
          <DialogTitle className="text-2xl">Happy birthday, {firstName}!</DialogTitle>
          <DialogDescription className="text-base">
            {message}
          </DialogDescription>
          <Button onClick={onClose} className="mt-2">Thanks!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
