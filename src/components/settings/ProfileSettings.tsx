'use client';

import { useState, useCallback } from 'react';
import { Cake, Save, Loader2, X } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/DatePicker';
import { Separator } from '@/components/ui/separator';
import { SettingRow } from './SettingRow';
import { useAuthStore } from '@/store/authStore';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import { saveUserBirthday } from '@/lib/db/queries/users';
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
  const jobTitle = userProfile?.jobTitle ?? null;

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
        await saveUserBirthday(account.localAccountId, isoToSave);
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
    <div className="space-y-6">
      <h2 className="text-sm font-semibold">Profile</h2>

      <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
        <Avatar className="h-16 w-16 shrink-0">
          {profilePhoto && <AvatarImage src={profilePhoto} alt={name} />}
          <AvatarFallback className="text-base bg-primary/10 text-primary font-semibold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{name}</p>
          {jobTitle && <p className="text-xs text-muted-foreground truncate">{jobTitle}</p>}
          {email && <p className="text-xs text-muted-foreground truncate mt-0.5">{email}</p>}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Cake size={14} className="text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personal</p>
        </div>

        <SettingRow
          label="Birthday"
          description="Used for the birthday surprise. Stored locally — not synced to D365."
        >
          <div className="flex items-center gap-1.5">
            <DatePicker
              value={birthday}
              onChange={setBirthday}
              placeholder="Select birthday"
              maxDate={new Date()}
              startMonth={new Date(new Date().getFullYear() - 100, 0)}
              endMonth={new Date(new Date().getFullYear(), 11)}
              className="h-8 w-[170px] text-xs"
            />
            {birthday && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleClear}
                title="Clear birthday"
              >
                <X size={13} />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={!dirty || saving}
              onClick={handleSave}
            >
              {saving ? (
                <><Loader2 size={13} className="mr-1.5 animate-spin" />Saving</>
              ) : (
                <><Save size={13} className="mr-1.5" />Save</>
              )}
            </Button>
          </div>
        </SettingRow>
      </div>
    </div>
  );
}
