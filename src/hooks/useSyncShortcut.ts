'use client';

import { useEffect } from 'react';
import { useSync } from '@/hooks/useSync';

/** Runs a full sync when the sync shortcut (Ctrl+Shift+R) or the palette's "Trigger Sync" fires. */
export function useSyncShortcut() {
  const { triggerSync } = useSync();

  useEffect(() => {
    const onSync = () => {
      triggerSync().catch((err) => console.error('[sync] shortcut sync failed:', err));
    };
    window.addEventListener('shortcut:sync', onSync);
    return () => window.removeEventListener('shortcut:sync', onSync);
  }, [triggerSync]);
}
