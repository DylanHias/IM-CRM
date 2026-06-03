'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Pure core of the typewriter smoother. Ollama emits text in uneven bursts;
 * to make output read like steady human typing we reveal characters at a capped
 * cadence, but accelerate to catch up when we fall too far behind the model so
 * the display never lags noticeably.
 *
 * @returns the new count of revealed characters (>= shown, <= target).
 */
export function computeReveal(
  shown: number,
  target: number,
  deltaMs: number,
  charsPerSecond: number,
  maxLagChars: number,
): number {
  if (target <= shown) return shown;
  const lag = target - shown;
  let reveal = Math.ceil((charsPerSecond * deltaMs) / 1000);
  // Accelerate: if we're further behind than maxLagChars, burn down the excess
  // this tick on top of the steady cadence.
  if (lag > maxLagChars) {
    reveal = Math.max(reveal, lag - maxLagChars);
  }
  return Math.min(target, shown + Math.max(reveal, 1));
}

const CHARS_PER_SECOND = 55; // steady cadence — feels like brisk typing
const MAX_LAG_CHARS = 120; // catch up if the model gets this far ahead

/**
 * Reveals `target` progressively as it grows, returning the slice to display.
 * When `target` resets to empty (new message), the reveal resets too.
 */
export function useTypewriter(target: string): string {
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetLenRef = useRef(0);

  targetLenRef.current = target.length;

  // Reset when the target shrinks (a fresh stream started).
  if (target.length < shownRef.current) {
    shownRef.current = 0;
  }

  useEffect(() => {
    const tick = (now: number) => {
      const last = lastTickRef.current ?? now;
      const delta = now - last;
      lastTickRef.current = now;

      const next = computeReveal(
        shownRef.current,
        targetLenRef.current,
        delta,
        CHARS_PER_SECOND,
        MAX_LAG_CHARS,
      );
      if (next !== shownRef.current) {
        shownRef.current = next;
        setShown(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = null;
    };
  }, []);

  return target.slice(0, shown);
}
