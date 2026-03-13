'use client';

import { motion } from 'framer-motion';

interface PageMotionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageMotion({ children, className }: PageMotionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={className}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
