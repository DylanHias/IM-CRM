'use client';

import { useAuthStore } from '@/store/authStore';
import { ShieldX } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export function AdminGuard({ children }: Props) {
  const isAdmin = useAuthStore((s) => s.isAdmin);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
        <ShieldX size={40} strokeWidth={1.5} />
        <p className="text-sm font-medium">Access denied</p>
        <p className="text-xs">You need admin privileges to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
