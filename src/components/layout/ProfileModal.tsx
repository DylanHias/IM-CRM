'use client';

import { useRouter } from 'next/navigation';
import { Shield, Settings, Bug, Keyboard, HelpCircle, LogOut, Mail, MapPin, Cake } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { signOut } from '@/lib/auth/authHelpers';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import { cn } from '@/lib/utils';

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

function formatBirthday(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
}

export function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const router = useRouter();
  const { account, isAdmin, profilePhoto, userProfile } = useAuthStore();

  const name = account?.name ? formatDisplayName(account.name) : 'User';
  const email = account?.username ?? '';
  const location = [userProfile?.city, userProfile?.country].filter(Boolean).join(', ') || userProfile?.officeLocation || null;
  const birthday = formatBirthday(userProfile?.birthday ?? null);
  const jobTitle = userProfile?.jobTitle ?? null;

  const go = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  const actions: { label: string; icon: typeof Settings; onClick: () => void; show?: boolean; destructive?: boolean }[] = [
    { label: 'Admin panel', icon: Shield, onClick: () => go('/admin'), show: isAdmin },
    { label: 'Account settings', icon: Settings, onClick: () => go('/settings') },
    { label: 'Debug', icon: Bug, onClick: () => go('/debug') },
    {
      label: 'Shortcuts',
      icon: Keyboard,
      onClick: () => {
        onOpenChange(false);
        useUIStore.getState().setShortcutsGuideOpen(true);
      },
    },
    { label: 'Help', icon: HelpCircle, onClick: () => go('/help') },
    { label: 'Log out', icon: LogOut, onClick: () => signOut(), destructive: true },
  ];

  const visible = actions.filter((a) => a.show !== false);

  // Layout: 3-column grid. When the count isn't a multiple of 3, the last row's
  // buttons grow to fill the remaining width (so 5 items → 3 on top, 2 wider below).
  const cols = 6;
  const fullRows = Math.floor(visible.length / 3);
  const lastRowCount = visible.length - fullRows * 3;
  const lastRowSpan = lastRowCount > 0 ? cols / lastRowCount : 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="sr-only">Profile</DialogTitle>

        <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
          <Avatar className="h-16 w-16 shrink-0">
            {profilePhoto && <AvatarImage src={profilePhoto} alt={name} />}
            <AvatarFallback className="text-base bg-primary/10 text-primary font-semibold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold truncate">{name}</h2>
              <span
                className={cn(
                  'text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0',
                  isAdmin
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {isAdmin ? 'Admin' : 'User'}
              </span>
            </div>
            {jobTitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{jobTitle}</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 p-3 space-y-2 text-xs">
          {email && <InfoRow icon={Mail} value={email} />}
          {location && <InfoRow icon={MapPin} value={location} />}
          {birthday && <InfoRow icon={Cake} value={birthday} />}
        </div>

        <div className="border-t pt-4 mt-2">
          <div className={`grid grid-cols-${cols} gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {visible.map((action, idx) => {
              const Icon = action.icon;
              const inLastRow = idx >= fullRows * 3;
              const span = inLastRow ? lastRowSpan : 2;
              return (
                <button
                  key={action.label}
                  onClick={action.onClick}
                  style={{ gridColumn: `span ${span} / span ${span}` }}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors',
                    action.destructive
                      ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                      : 'border-border hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon size={16} />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-1">
          v{process.env.NEXT_PUBLIC_APP_VERSION}
        </p>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon: Icon, value }: { icon: typeof Mail; value: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon size={12} className="flex-shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
}
