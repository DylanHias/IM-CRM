'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { onOnlineStatusChange, isOnline } from '@/lib/utils/offlineUtils';

export function useConnectivityToasts() {
  const wasOnline = useRef(isOnline());

  useEffect(() => {
    return onOnlineStatusChange((online) => {
      if (online && !wasOnline.current) {
        toast.success('Back online', {
          description: 'Your changes will sync automatically',
        });
      } else if (!online && wasOnline.current) {
        toast.warning('You\'re offline', {
          description: 'Changes will be saved locally and sync when you reconnect',
          duration: 6000,
        });
      }
      wasOnline.current = online;
    });
  }, []);
}
