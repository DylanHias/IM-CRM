'use client';

import { useMemo } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { visibleSidebarTabs } from '@/lib/navigation';

/** The sidebar entries in display order; number shortcuts 1–9 map onto this list. */
export function useNavOrder() {
  const order = useSettingsStore((s) => s.sidebarOrder);
  const hidden = useSettingsStore((s) => s.sidebarHiddenTabs);
  return useMemo(() => visibleSidebarTabs(order, hidden), [order, hidden]);
}
