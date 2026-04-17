'use client';

import { useReducedMotion } from 'framer-motion';

export const easeSmooth = [0.25, 0.46, 0.45, 0.94] as const;

export const underlineSpring = { type: 'spring', stiffness: 380, damping: 30 } as const;

export const pageFadeUp = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: 'easeOut' },
} as const;

export const tabPanelMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.15, ease: easeSmooth },
} as const;

export const listContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

export const listItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const } },
};

export function rowSlideIn(i: number) {
  return {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.3, delay: Math.min(i * 0.05, 0.4), ease: 'easeOut' },
  } as const;
}

export function statCardMotion(i: number) {
  return {
    initial: { opacity: 0, y: 12, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.15, delay: i * 0.03, ease: 'easeOut' },
  } as const;
}

export function sectionReveal(delay = 0) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18, delay, ease: 'easeOut' },
  } as const;
}

export function useReducedPageMotion() {
  return useReducedMotion() ?? false;
}
