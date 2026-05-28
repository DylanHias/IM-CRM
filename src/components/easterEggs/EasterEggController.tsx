'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { armSalesMode, isSalesModeArmed, shouldShowBirthdayToday, isEasterEggsEnabled } from '@/lib/easterEggs';
import { BirthdayModal } from './BirthdayModal';

const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
];

export function EasterEggController() {
  const account = useAuthStore((s) => s.account);
  const userProfile = useAuthStore((s) => s.userProfile);
  const [birthdayOpen, setBirthdayOpen] = useState(false);

  // Konami listener
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let buffer: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      if (!isEasterEggsEnabled()) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      buffer.push(e.key);
      if (buffer.length > KONAMI.length) buffer = buffer.slice(-KONAMI.length);
      if (buffer.length === KONAMI.length && buffer.every((k, i) => k === KONAMI[i])) {
        buffer = [];
        if (isSalesModeArmed()) {
          toast.message('🎯 Sales Mode already armed — go close a deal!');
          return;
        }
        armSalesMode();
        toast.success('🎯 Sales Mode armed', {
          description: 'Your next won opportunity gets a hero\'s welcome.',
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Birthday check — reads birthday from authStore.userProfile (loaded by useAuth)
  useEffect(() => {
    if (!account || !userProfile) return;
    if (!isEasterEggsEnabled()) return;
    if (shouldShowBirthdayToday(userProfile.birthday)) setBirthdayOpen(true);
  }, [account, userProfile]);

  const firstName = account?.name?.split(' ')[0] ?? 'friend';

  return <BirthdayModal open={birthdayOpen} firstName={firstName} onClose={() => setBirthdayOpen(false)} />;
}
