'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Download, Loader2, CheckCircle2, Copy, Check } from 'lucide-react';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { SettingRow } from './SettingRow';
import { storeChangelog } from '@/components/layout/ChangelogDialog';
import { useSettingsStore } from '@/store/settingsStore';
import { emitDataEvent } from '@/lib/dataEvents';
import { toast } from 'sonner';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? 'dev';

export function GeneralSettings() {
  const { resetAll } = useSettingsStore();
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'up-to-date'>('idle');
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const updateRef = useRef<Awaited<ReturnType<typeof import('@tauri-apps/plugin-updater').check>> | null>(null);
  const [schemaVersion, setSchemaVersion] = useState<string | null>(null);
  const [autostart, setAutostart] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!isTauriApp()) return;
      try {
        const { getDb } = await import('@/lib/db/client');
        const db = await getDb();
        const rows = await db.select<{ value: string }[]>(
          `SELECT value FROM app_settings WHERE key = 'schema_version'`
        );
        if (rows.length > 0) setSchemaVersion(rows[0].value);
      } catch (error) {
        console.error('[settings] Failed to load schema version:', error);
      }
      try {
        const { isEnabled } = await import('@tauri-apps/plugin-autostart');
        setAutostart(await isEnabled());
      } catch (error) {
        console.error('[settings] Failed to check autostart status:', error);
      }
    };
    load();
  }, []);

  const toggleAutostart = useCallback(async (enabled: boolean) => {
    if (!isTauriApp()) return;
    try {
      const { enable, disable } = await import('@tauri-apps/plugin-autostart');
      if (enabled) {
        await enable();
      } else {
        await disable();
      }
      setAutostart(enabled);
    } catch (error) {
      console.error('[settings] Failed to toggle autostart:', error);
    }
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!isTauriApp()) return;
    setUpdateStatus('checking');
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (update) {
        updateRef.current = update;
        setUpdateStatus('available');
        setUpdateVersion(update.version);
      } else {
        setUpdateStatus('up-to-date');
      }
    } catch (error) {
      console.error('[updater] Failed to check for updates:', error);
      setUpdateStatus('idle');
    }
  }, []);

  const installUpdate = useCallback(async () => {
    const update = updateRef.current;
    if (!update) return;
    try {
      setUpdateStatus('downloading');
      if (update.body) {
        await storeChangelog(update.body, update.version);
      }
      await update.downloadAndInstall();
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (error) {
      console.error('[updater] Failed to install update:', error);
      setUpdateStatus('available');
    }
  }, []);

  const handleResetAll = useCallback(() => {
    resetAll();
    toast.success('All settings reset to defaults');
  }, [resetAll]);

  const [clearing, setClearing] = useState(false);

  const handleClearDatabase = useCallback(async () => {
    if (!isTauriApp()) return;
    setClearing(true);
    try {
      const { getDb } = await import('@/lib/db/client');
      const db = await getDb();
      const tables = [
        'invoice_lines', 'invoices', 'activities', 'follow_ups',
        'contacts', 'opportunities', 'option_sets', 'sync_records',
        'audit_log', 'customers',
      ];
      for (const table of tables) {
        await db.execute(`DELETE FROM ${table}`);
      }
      const { resetSyncWatermark } = await import('@/lib/sync/syncService');
      await resetSyncWatermark();
      emitDataEvent('customer', 'updated');
      emitDataEvent('contact', 'updated');
      emitDataEvent('opportunity', 'updated');
      emitDataEvent('activity', 'updated');
      emitDataEvent('followup', 'updated');
      toast.success('Local database cleared');
    } catch (error) {
      console.error('[db] Failed to clear local database:', error);
      toast.error('Failed to clear local database');
    } finally {
      setClearing(false);
    }
  }, []);

  const copyVersionInfo = useCallback(async () => {
    const info = `App: ${APP_VERSION}${schemaVersion ? ` | Schema: v${schemaVersion}` : ''}`;
    await navigator.clipboard.writeText(info);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [schemaVersion]);

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold">General</h2>

      <div className="space-y-5">
        <SettingRow label="Updates" description={
          updateStatus === 'downloading'
            ? `Downloading version ${updateVersion}...`
            : updateStatus === 'available' && updateVersion
              ? `Version ${updateVersion} is available`
              : updateStatus === 'up-to-date'
                ? 'You\'re on the latest version'
                : 'Check if a newer version is available'
        }>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
            onClick={updateStatus === 'available' ? installUpdate : checkForUpdates}
          >
            {updateStatus === 'checking' ? (
              <><Loader2 size={13} className="mr-1.5 animate-spin" />Checking...</>
            ) : updateStatus === 'downloading' ? (
              <><Loader2 size={13} className="mr-1.5 animate-spin" />Downloading...</>
            ) : updateStatus === 'up-to-date' ? (
              <><CheckCircle2 size={13} className="mr-1.5" />Up to date</>
            ) : updateStatus === 'available' ? (
              <><Download size={13} className="mr-1.5" />Install update</>
            ) : (
              <><Download size={13} className="mr-1.5" />Check for updates</>
            )}
          </Button>
        </SettingRow>

        {autostart !== null && (
          <SettingRow label="Launch on startup" description="Automatically start the app when you log in to Windows">
            <Switch
              checked={autostart}
              onCheckedChange={toggleAutostart}
            />
          </SettingRow>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">App info</p>
            <p className="text-xs text-muted-foreground">
              Version {APP_VERSION}{schemaVersion ? ` · Schema v${schemaVersion}` : ''}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={copyVersionInfo}
          >
            {copied
              ? <><Check size={13} className="mr-1.5" />Copied</>
              : <><Copy size={13} className="mr-1.5" />Copy</>
            }
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Reset all settings</p>
          <p className="text-xs text-muted-foreground">Restore every setting to its default value</p>
        </div>
        <ConfirmPopover message="Reset all settings to defaults? This cannot be undone." confirmLabel="Reset all" onConfirm={handleResetAll}>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            Reset all
          </Button>
        </ConfirmPopover>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Clear local database</p>
          <p className="text-xs text-muted-foreground">Delete all synced data (customers, contacts, activities, etc.)</p>
        </div>
        <ConfirmPopover message="Delete all local data? You'll need to re-sync from D365." confirmLabel="Clear" onConfirm={handleClearDatabase}>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
            disabled={clearing}
          >
            {clearing ? <><Loader2 size={13} className="mr-1.5 animate-spin" />Clearing...</> : 'Clear data'}
          </Button>
        </ConfirmPopover>
      </div>
    </div>
  );
}
