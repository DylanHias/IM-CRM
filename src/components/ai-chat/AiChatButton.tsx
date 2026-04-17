'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { useAiChatStore } from '@/store/aiChatStore';

interface Props {
  className?: string;
}

export function AiChatButton({ className }: Props) {
  if (!isTauriApp()) return null;

  return <AiChatButtonInner className={className} />;
}

function AiChatButtonInner({ className }: Props) {
  const { isOpen, toggleOpen, ollamaStatus } = useAiChatStore();

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={toggleOpen}
      aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      className={cn(
        'fixed bottom-6 right-6 z-40',
        'relative h-12 w-12 rounded-full',
        'bg-primary text-primary-foreground',
        'shadow-lg hover:shadow-xl',
        'flex items-center justify-center',
        'transition-shadow duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isOpen ? 'close' : 'open'}
          initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
          transition={{ duration: 0.15 }}
        >
          {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        </motion.span>
      </AnimatePresence>

      {/* Status dot */}
      {ollamaStatus === 'unavailable' && !isOpen && (
        <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
      )}
    </motion.button>
  );
}
