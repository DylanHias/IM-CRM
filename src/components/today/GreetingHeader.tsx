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

  const parts = greeting.split(firstName);

  return (
    <div>
      <p className="text-2xl font-semibold tracking-tight">
        {parts.map((part, i) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className="text-foreground font-bold bg-primary/10 px-1 rounded">
                {firstName}
              </span>
            )}
          </span>
        ))}
      </p>
      <p className="text-sm text-muted-foreground mt-0.5">{today}</p>
    </div>
  );
}
