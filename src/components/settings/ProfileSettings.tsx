'use client';

import { useState, useCallback } from 'react';
import { Cake, Save, Loader2, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/DatePicker';
import { useAuthStore } from '@/store/authStore';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import { saveUserBirthday, resolveUserDbId } from '@/lib/db/queries/users';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { toast } from 'sonner';

function getInitials(name: string): string {
  return formatDisplayName(name)
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function toInputDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function ProfileSettings() {
  const { account, profilePhoto, userProfile, setUserProfile } = useAuthStore();
  const name = account?.name ? formatDisplayName(account.name) : 'User';
  const email = account?.username ?? '';

  const [birthday, setBirthday] = useState<string>(toInputDate(userProfile?.birthday ?? null));
  const [saving, setSaving] = useState(false);

  const initial = toInputDate(userProfile?.birthday ?? null);
  const dirty = birthday !== initial;

  const handleSave = useCallback(async () => {
    if (!account?.localAccountId) return;
    setSaving(true);
    try {
      const isoToSave = birthday ? new Date(birthday).toISOString() : null;
      if (isTauriApp()) {
        const userId = await resolveUserDbId(account.localAccountId, account.username);
        await saveUserBirthday(userId, isoToSave);
      }
      setUserProfile({
        jobTitle: userProfile?.jobTitle ?? null,
        mobilePhone: userProfile?.mobilePhone ?? null,
        businessPhones: userProfile?.businessPhones ?? [],
        country: userProfile?.country ?? null,
        city: userProfile?.city ?? null,
        officeLocation: userProfile?.officeLocation ?? null,
        birthday: isoToSave,
      });
      toast.success('Birthday saved');
    } catch (err) {
      console.error('[settings] Failed to save birthday:', err);
      toast.error('Failed to save birthday');
    } finally {
      setSaving(false);
    }
  }, [account, birthday, userProfile, setUserProfile]);

  const handleClear = useCallback(() => setBirthday(''), []);

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-[calc(var(--radius)*1.5)] border border-border bg-card p-4">
      <Avatar className="h-[60px] w-[60px] shrink-0 border border-primary/30">
        {profilePhoto && <AvatarImage src={profilePhoto} alt={name} />}
        <AvatarFallback className="bg-accent text-[19px] font-semibold text-accent-foreground">{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-[200px] flex-1">
        <p className="truncate text-base font-semibold">{name}</p>
        {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
      </div>
      <div className="grid justify-items-end gap-1">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Cake size={11} /> Birthday
        </span>
        <div className="flex items-center gap-1.5">
          <DatePicker
            value={birthday}
            onChange={setBirthday}
            placeholder="Select birthday"
            maxDate={new Date()}
            startMonth={new Date(new Date().getFullYear() - 100, 0)}
            endMonth={new Date(new Date().getFullYear(), 11)}
            className="h-[26px] w-[150px] text-xs"
          />
          {birthday && (
            <Button variant="ghost" size="icon" className="size-[26px]" onClick={handleClear} title="Clear birthday">
              <X size={13} />
            </Button>
          )}
          <Button variant="outline" size="sm" disabled={!dirty || saving} onClick={handleSave}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? 'Saving' : 'Save'}
          </Button>
        </div>
      </div>
    </section>
  );
}
