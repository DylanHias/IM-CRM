'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import { pickGreeting } from '@/lib/today/greetings';

export function GreetingHeader() {
  const account = useAuthStore((s) => s.account);
  const firstName = account?.name ? formatDisplayName(account.name).split(' ')[0] : 'there';
  const [greeting] = useState(() => pickGreeting(firstName));

  const today = new Date().toLocaleDateString('en-BE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div>
      <p className="text-2xl font-semibold tracking-tight">{greeting}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
    </div>
  );
}
