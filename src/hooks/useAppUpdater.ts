import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { useSettingsStore } from '@/store/settingsStore';
import { storeChangelog } from '@/components/layout/ChangelogDialog';

interface AppUpdaterState {
  updateAvailable: boolean;
  downloading: boolean;
  install: () => void;
}

const POLL_INTERVAL = 30 * 60 * 1000;

export function useAppUpdater(): AppUpdaterState {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const updateRef = useRef<Awaited<ReturnType<typeof import('@tauri-apps/plugin-updater').check>> | null>(null);

  const checkForUpdate = useCallback(async () => {
    if (!isTauriApp()) return;
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (update) {
        updateRef.current = update;
        setUpdateAvailable(true);
        if (useSettingsStore.getState().showUpdateToasts) {
          toast.info(`Update ${update.version} available`, {
            description: 'Click the update button in the sidebar to install',
            duration: 8000,
          });
        }
      }
    } catch (error) {
      console.error('[updater] Failed to check for updates:', error);
    }
  }, []);

  useEffect(() => {
    checkForUpdate();
    const interval = setInterval(checkForUpdate, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [checkForUpdate]);

  const install = useCallback(async () => {
    const update = updateRef.current;
    if (!update || downloading) return;
    try {
      setDownloading(true);
      if (update.body) {
        await storeChangelog(update.body, update.version);
      }
      await update.downloadAndInstall();
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (error) {
      console.error('[updater] Failed to install update:', error);
      setDownloading(false);
    }
  }, [downloading]);

  return { updateAvailable, downloading, install };
}
