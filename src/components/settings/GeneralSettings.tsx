'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { storeChangelog } from '@/components/layout/ChangelogDialog';

export function GeneralSettings() {
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'up-to-date'>('idle');
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const updateRef = useRef<Awaited<ReturnType<typeof import('@tauri-apps/plugin-updater').check>> | null>(null);

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

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold">General</h2>

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Updates</p>
          <p className="text-xs text-muted-foreground">
            {updateStatus === 'downloading'
              ? `Downloading version ${updateVersion}...`
              : updateStatus === 'available' && updateVersion
                ? `Version ${updateVersion} is available`
                : updateStatus === 'up-to-date'
                  ? 'You\'re on the latest version'
                  : 'Check if a newer version is available'}
          </p>
        </div>
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
      </div>
    </div>
  );
}
