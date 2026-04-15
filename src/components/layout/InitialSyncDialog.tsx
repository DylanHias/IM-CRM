'use client';

import { useEffect, useRef, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSyncStore } from '@/store/syncStore';
import { useAuthStore } from '@/store/authStore';
import { useSync } from '@/hooks/useSync';
import { getAppSetting } from '@/lib/db/queries/sync';
import { formatDisplayName } from '@/lib/utils/nameUtils';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { cn } from '@/lib/utils';
import { emitDataEvent } from '@/lib/dataEvents';

export function InitialSyncDialog() {
  const lastD365SyncAt = useSyncStore((s) => s.lastD365SyncAt);
  const initialSyncProgress = useSyncStore((s) => s.initialSyncProgress);
  const account = useAuthStore((s) => s.account);
  const { triggerSync } = useSync();

  const [needsInitialSync, setNeedsInitialSync] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const didTrigger = useRef(false);

  // Check if this is a first-time sync
  useEffect(() => {
    if (!isTauriApp()) return;
    const check = async () => {
      const lastSync = await getAppSetting('last_d365_sync');
      if (!lastSync || lastSync.length === 0) {
        setNeedsInitialSync(true);
      }
    };
    check();
  }, []);

  // Trigger sync once when dialog activates
  useEffect(() => {
    if (!needsInitialSync || didTrigger.current) return;
    didTrigger.current = true;
    if (!useSyncStore.getState().initialSyncProgress) {
      useSyncStore.getState().setInitialSyncProgress({ phase: 'Preparing...', processed: 0, total: 0 });
    }
    triggerSync();
  }, [needsInitialSync, triggerSync]);

  // Detect sync completion
  useEffect(() => {
    if (needsInitialSync && lastD365SyncAt && !syncComplete) {
      setSyncComplete(true);
      useSyncStore.getState().setInitialSyncProgress(null);
    }
  }, [needsInitialSync, lastD365SyncAt, syncComplete]);

  if (!needsInitialSync || dismissed) return null;

  const firstName = account?.name ? formatDisplayName(account.name).split(' ')[0] : 'there';
  const progress = initialSyncProgress;
  const percent = progress && progress.total > 0
    ? Math.round((progress.processed / progress.total) * 100)
    : 0;

  return (
    <DialogPrimitive.Root open>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-full max-w-[440px] translate-x-[-50%] translate-y-[-50%]',
            'rounded-xl border bg-card p-10 shadow-lg',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          )}
        >
          <div className="flex flex-col items-center text-center">
            {syncComplete ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success mb-6">
                  <Check className="h-6 w-6 text-success-foreground" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  Welcome, {firstName}!
                </h2>
                <p className="text-sm text-muted-foreground mb-8">
                  Your workspace is ready
                </p>
                <Button onClick={() => {
                  emitDataEvent('followup', 'updated');
                  emitDataEvent('activity', 'updated');
                  emitDataEvent('walkthrough', 'updated');
                  setDismissed(true);
                }} size="lg">
                  Get started
                </Button>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-6">
                  <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Setting up your workspace
                </h2>
                <p className="text-sm text-muted-foreground mb-1">
                  {progress?.phase ?? 'Preparing...'}
                </p>
                <p className="text-xs text-muted-foreground/70 mb-6">
                  This usually takes around 30 minutes but don&apos;t worry, you&apos;ll only have to do this once.
                </p>
                <div className="w-full">
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden mb-3">
                    {progress?.total && progress.total > 0 ? (
                      <div
                        data-testid="sync-progress-fill"
                        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${percent}%` }}
                      />
                    ) : (
                      <div
                        data-testid="sync-progress-fill"
                        className="h-full w-full rounded-full bg-primary/50 animate-pulse"
                      />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {progress?.total && progress.total > 0
                      ? `${progress.processed.toLocaleString()} / ${progress.total.toLocaleString()} records`
                      : 'Fetching data from Dynamics 365\u2026'}
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
