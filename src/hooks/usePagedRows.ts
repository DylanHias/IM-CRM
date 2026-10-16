'use client';

import { useEffect, useState } from 'react';

/** Whole rows of `rowHeight` px that fit in `height`, never fewer than one. */
export function rowsThatFit(height: number, rowHeight: number): number {
  return Math.max(1, Math.floor(height / rowHeight));
}

/** Keeps `page` inside the range `total` items need at `pageSize`. */
export function clampPage(page: number, total: number, pageSize: number): number {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(Math.max(page, 1), pages);
}

/**
 * Fills a panel that stretches to the viewport: measures the list area, shows as many rows as
 * fit and pages the rest. Attach `ref` to the element the rows live in.
 */
export function usePagedRows<T>(items: T[], rowHeight: number, fallbackRows = 5) {
  // A callback ref, so the same hook can measure a ul, an ol or a div.
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [rows, setRows] = useState(fallbackRows);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setRows(rowsThatFit(entry.contentRect.height, rowHeight)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [el, rowHeight]);

  const safePage = clampPage(page, items.length, rows);
  return {
    ref: setEl,
    page: safePage,
    pageSize: rows,
    setPage,
    visible: items.slice((safePage - 1) * rows, safePage * rows),
  };
}
