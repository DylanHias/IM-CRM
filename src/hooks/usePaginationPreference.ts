'use client';

import { useState, useEffect, useCallback } from 'react';
import { isTauriApp } from '@/lib/utils/offlineUtils';

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const memoryCache = new Map<string, number>();

export function usePaginationPreference(tableKey: string, defaultPageSize = DEFAULT_PAGE_SIZE) {
  const cacheKey = `pagination.${tableKey}.pageSize`;
  const [pageSize, setPageSizeState] = useState(
    () => memoryCache.get(cacheKey) ?? defaultPageSize,
  );

  useEffect(() => {
    if (!isTauriApp() || memoryCache.has(cacheKey)) return;
    const load = async () => {
      try {
        const { getDb } = await import('@/lib/db/client');
        const db = await getDb();
        const rows = await db.select<{ value: string }[]>(
          `SELECT value FROM app_settings WHERE key = $1`,
          [cacheKey],
        );
        if (rows.length > 0) {
          const val = parseInt(rows[0].value, 10);
          if (PAGE_SIZE_OPTIONS.includes(val)) {
            memoryCache.set(cacheKey, val);
            setPageSizeState(val);
          }
        }
      } catch (err) {
        console.error('[settings] Failed to load pagination preference:', err);
      }
    };
    load();
  }, [cacheKey]);

  const setPageSize = useCallback((size: number) => {
    memoryCache.set(cacheKey, size);
    setPageSizeState(size);
    if (isTauriApp()) {
      import('@/lib/db/queries/sync').then(({ setAppSetting }) => {
        setAppSetting(cacheKey, String(size));
      }).catch((err) => {
        console.error('[settings] Failed to save pagination preference:', err);
      });
    }
  }, [cacheKey]);

  return { pageSize, setPageSize, pageSizeOptions: PAGE_SIZE_OPTIONS };
}
