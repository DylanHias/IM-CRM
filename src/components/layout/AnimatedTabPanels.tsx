'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { tabPanelMotion } from '@/lib/motion';
import type { ReactNode } from 'react';

interface AnimatedTabPanelsProps {
  activeKey: string;
  children: ReactNode;
  className?: string;
}

export function AnimatedTabPanels({ activeKey, children, className }: AnimatedTabPanelsProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={activeKey} {...tabPanelMotion} className={className}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
