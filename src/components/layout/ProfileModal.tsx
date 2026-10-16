'use client';

import { useRouter } from 'next/navigation';
import { Shield, Settings, Bug, Keyboard, HelpCircle, LogOut, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { signOut } from '@/lib/auth/authHelpers';
import { formatDisplayName } from '@/lib/utils/nameUtils';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getInitials(name: string): string {
  return formatDisplayName(name)
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const router = useRouter();
  const { account, isAdmin, profilePhoto } = useAuthStore();

  const name = account?.name ? formatDisplayName(account.name) : 'User';
  const email = account?.username ?? '';

  const go = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  const tiles: { label: string; icon: typeof Settings; onClick: () => void; show?: boolean }[] = [
    { label: 'Sync', icon: RefreshCw, onClick: () => go('/sync') },
    { label: 'Settings', icon: Settings, onClick: () => go('/settings') },
    { label: 'Help', icon: HelpCircle, onClick: () => go('/help') },
    { label: 'Admin', icon: Shield, onClick: () => go('/admin'), show: isAdmin },
    { label: 'Debug', icon: Bug, onClick: () => go('/debug') },
    {
      label: 'Shortcuts',
      icon: Keyboard,
      onClick: () => {
        onOpenChange(false);
        useUIStore.getState().setShortcutsGuideOpen(true);
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px] gap-0 overflow-hidden rounded-xl border-0 bg-card p-0 shadow-2xl [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">Account</DialogTitle>

        <div className="flex items-center gap-3 p-4">
          <Avatar className="h-11 w-11 shrink-0 border border-primary/30">
            {profilePhoto && <AvatarImage src={profilePhoto} alt={name} />}
            <AvatarFallback className="bg-accent text-[15px] font-semibold text-accent-foreground">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 px-2 pb-2">
          {tiles
            .filter((t) => t.show !== false)
            .map(({ label, icon: Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className="group/tile grid justify-items-center gap-1.5 rounded-lg px-1 py-2.5 text-xs text-foreground-2 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon size={18} className="text-muted-foreground transition-colors group-hover/tile:text-primary" />
                <span>{label}</span>
              </button>
            ))}
        </div>

        <div className="flex items-center border-t border-border bg-surface-2 py-1.5 pl-4 pr-2">
          <span className="text-[11px] text-faint">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="ml-auto h-7 gap-1.5 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut size={13} />
            Log out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
