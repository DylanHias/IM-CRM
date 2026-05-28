'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useSyncStore } from '@/store/syncStore';
import { SettingRow } from './SettingRow';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLastSyncTimes, type LastSyncTimes } from '@/lib/db/queries/sync';
import { formatRelative } from '@/lib/utils/dateUtils';
import { isTauriApp } from '@/lib/utils/offlineUtils';

const FULL_SYNC_PRESETS = [15, 30, 60];
const PENDING_PRESETS = [5, 15, 30];
const POWERBI_PRESETS = [60, 120, 240];
const RETENTION_PRESETS = [30, 90, 180];

const INTERVAL_MIN = 5;
const INTERVAL_MAX = 120;
const POWERBI_MIN = 30;
const POWERBI_MAX = 720;
const RETENTION_MIN = 7;
const RETENTION_MAX = 365;

export function SyncSettings() {
  const {
    autoSyncOnLaunch, syncPaused, syncOnWindowFocus,
    syncIntervalMinutes, syncPendingIntervalMinutes, powerBiRefreshIntervalMinutes,
    syncScopeD365, syncScopePowerBi, syncScopePushPending,
    syncHistoryRetentionDays, showSyncToasts,
    updateSetting, resetSection,
  } = useSettingsStore();

  const isSyncing = useSyncStore((s) => s.isSyncing);
  const [lastTimes, setLastTimes] = useState<LastSyncTimes>({ d365: null, powerBi: null, pendingPush: null });

  useEffect(() => {
    if (!isTauriApp()) return;
    let cancelled = false;
    getLastSyncTimes()
      .then((t) => { if (!cancelled) setLastTimes(t); })
      .catch((err) => console.error('[settings] getLastSyncTimes failed:', err));
    return () => { cancelled = true; };
  }, [isSyncing]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Sync</h2>
        <ConfirmPopover message="Reset sync settings to defaults?" confirmLabel="Reset" onConfirm={() => resetSection('sync')}>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
            <RotateCcw size={12} className="mr-1" />
            Reset
          </Button>
        </ConfirmPopover>
      </div>

      {/* General */}
      <div className="space-y-5">
        <SectionHeader>General</SectionHeader>

        <SettingRow label="Pause auto-sync" description="Temporarily stop background syncs without changing intervals">
          <Switch checked={syncPaused} onCheckedChange={(v) => updateSetting('syncPaused', v)} />
        </SettingRow>

        <SettingRow label="Auto-sync on launch" description="Automatically sync data when the app starts">
          <Switch
            checked={autoSyncOnLaunch}
            onCheckedChange={(v) => updateSetting('autoSyncOnLaunch', v)}
            disabled={syncPaused}
          />
        </SettingRow>

        <SettingRow label="Sync on window focus" description="Run a sync when you return to the app (max once every 5 min)">
          <Switch
            checked={syncOnWindowFocus}
            onCheckedChange={(v) => updateSetting('syncOnWindowFocus', v)}
            disabled={syncPaused}
          />
        </SettingRow>

        <SettingRow label="Show sync toasts" description="Display notifications when sync completes or fails">
          <Switch
            checked={showSyncToasts}
            onCheckedChange={(v) => updateSetting('showSyncToasts', v)}
          />
        </SettingRow>
      </div>

      {/* Intervals */}
      <div className="space-y-5">
        <SectionHeader>Intervals</SectionHeader>

        <IntervalRow
          label="Full sync interval"
          description="Minutes between full background syncs"
          value={syncIntervalMinutes}
          onChange={(v) => updateSetting('syncIntervalMinutes', v)}
          min={INTERVAL_MIN}
          max={INTERVAL_MAX}
          presets={FULL_SYNC_PRESETS}
          lastSyncAt={lastTimes.d365}
          disabled={syncPaused}
        />

        <IntervalRow
          label="Pending push interval"
          description="Minutes between automatic pushes of pending changes"
          value={syncPendingIntervalMinutes}
          onChange={(v) => updateSetting('syncPendingIntervalMinutes', v)}
          min={INTERVAL_MIN}
          max={INTERVAL_MAX}
          presets={PENDING_PRESETS}
          lastSyncAt={lastTimes.pendingPush}
          disabled={syncPaused}
        />

        <IntervalRow
          label="Power BI refresh interval"
          description="Minutes between standalone Power BI revenue refreshes"
          value={powerBiRefreshIntervalMinutes}
          onChange={(v) => updateSetting('powerBiRefreshIntervalMinutes', v)}
          min={POWERBI_MIN}
          max={POWERBI_MAX}
          presets={POWERBI_PRESETS}
          lastSyncAt={lastTimes.powerBi}
          disabled={syncPaused}
        />
      </div>

      {/* Scope */}
      <div className="space-y-5">
        <SectionHeader>Sync scope</SectionHeader>

        <SettingRow label="Customers & activities (Dynamics 365)" description="Pull customers, contacts, activities, opportunities, follow-ups">
          <Switch
            checked={syncScopeD365}
            onCheckedChange={(v) => updateSetting('syncScopeD365', v)}
          />
        </SettingRow>

        <SettingRow label="Revenue & insights (Power BI)" description="Pull ARR totals, insights, and ARR movement snapshots">
          <Switch
            checked={syncScopePowerBi}
            onCheckedChange={(v) => updateSetting('syncScopePowerBi', v)}
          />
        </SettingRow>

        <SettingRow label="Push pending changes" description="Send your local edits back to Dynamics 365">
          <Switch
            checked={syncScopePushPending}
            onCheckedChange={(v) => updateSetting('syncScopePushPending', v)}
          />
        </SettingRow>
      </div>

      {/* History */}
      <div className="space-y-5">
        <SectionHeader>History</SectionHeader>

        <IntervalRow
          label="Keep sync history"
          description="Older sync history entries are deleted on app start"
          value={syncHistoryRetentionDays}
          onChange={(v) => updateSetting('syncHistoryRetentionDays', v)}
          min={RETENTION_MIN}
          max={RETENTION_MAX}
          presets={RETENTION_PRESETS}
          unit="days"
        />
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
  );
}

interface IntervalRowProps {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  presets: number[];
  unit?: string;
  lastSyncAt?: string | null;
  disabled?: boolean;
}

function IntervalRow({ label, description, value, onChange, min, max, presets, unit = 'min', lastSyncAt, disabled }: IntervalRowProps) {
  const [draft, setDraft] = useState<string>(String(value));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setDraft(String(value)); }, [value]);

  const rangeHint = useMemo(() => `${min}–${max} ${unit}`, [min, max, unit]);
  const lastLine = lastSyncAt !== undefined
    ? lastSyncAt ? `Last run: ${formatRelative(lastSyncAt)}` : 'Last run: never'
    : null;

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (!Number.isFinite(parsed)) {
      setError(rangeHint);
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    if (clamped !== parsed) setError(`Clamped to ${clamped} ${unit}`);
    else setError(null);
    onChange(clamped);
    setDraft(String(clamped));
  };

  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium', disabled && 'text-muted-foreground')}>{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        {(lastLine || error) && (
          <p className={cn('text-[11px] mt-0.5', error ? 'text-destructive' : 'text-muted-foreground')}>
            {error ?? lastLine}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          {presets.map((p) => (
            <Button
              key={p}
              type="button"
              variant={p === value ? 'secondary' : 'ghost'}
              size="sm"
              disabled={disabled}
              className="h-7 px-2 text-xs"
              onClick={() => { onChange(p); setDraft(String(p)); setError(null); }}
            >
              {p}
            </Button>
          ))}
          <Input
            type="number"
            min={min}
            max={max}
            value={draft}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            className="w-[64px] h-8 text-xs text-center"
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">{rangeHint}</p>
      </div>
    </div>
  );
}
