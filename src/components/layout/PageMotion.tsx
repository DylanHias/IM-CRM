'use client';

import { motion } from 'framer-motion';
import { pageFadeUp, useReducedPageMotion } from '@/lib/motion';

interface PageMotionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageMotion({ children, className }: PageMotionProps) {
  const reduced = useReducedPageMotion();
  return (
    <motion.div
      {...(reduced ? {} : pageFadeUp)}
      className={className}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
