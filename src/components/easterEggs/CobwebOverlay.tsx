'use client';

import { isEasterEggsEnabled } from '@/lib/easterEggs';

interface Props {
  daysStale: number;
}

// Fades in past 90d, denser past 180d. Top-left corner cobweb, purely decorative.
export function CobwebOverlay({ daysStale }: Props) {
  if (daysStale < 90) return null;
  if (typeof window !== 'undefined' && !isEasterEggsEnabled()) return null;

  const opacity = Math.min(0.45, 0.15 + (daysStale - 90) / 360);
  const size = daysStale >= 180 ? 36 : 26;

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className="pointer-events-none absolute top-0 left-0 text-muted-foreground"
      style={{ opacity }}
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round">
        <path d="M0 0 L40 40" />
        <path d="M0 0 L40 20" />
        <path d="M0 0 L40 8" />
        <path d="M0 0 L20 40" />
        <path d="M0 0 L8 40" />
        <path d="M6 0 Q10 6 0 10" />
        <path d="M14 0 Q18 12 0 18" />
        <path d="M24 0 Q28 18 0 26" />
        <path d="M34 0 Q36 26 0 34" />
      </g>
    </svg>
  );
}
