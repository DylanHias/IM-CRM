'use client';

import { useState, useEffect } from 'react';
import { onOnlineStatusChange, isOnline } from '@/lib/utils/offlineUtils';

export function useOnlineStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(isOnline());
    return onOnlineStatusChange(setOnline);
  }, []);

  return online;
}
