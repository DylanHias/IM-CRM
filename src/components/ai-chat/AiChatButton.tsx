'use client';

import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { useAiChatStore } from '@/store/aiChatStore';

interface Props {
  className?: string;
}

export function AiChatButton({ className }: Props) {
  const isOpen = useAiChatStore((s) => s.isOpen);
  if (!isTauriApp() || isOpen) return null;

  return <AiChatButtonInner className={className} />;
}

function AiChatButtonInner({ className }: Props) {
  const { toggleOpen, ollamaStatus } = useAiChatStore();

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      onClick={toggleOpen}
      aria-label="Open AI Assistant"
      className={cn(
        'fixed bottom-6 right-6 z-40',
        'h-12 w-12 rounded-full',
        'bg-primary text-primary-foreground',
        'shadow-lg hover:shadow-xl',
        'flex items-center justify-center',
        'transition-shadow duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      <MessageCircle className="h-5 w-5" />

      {/* Status dot */}
      {ollamaStatus === 'unavailable' && (
        <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
      )}
    </motion.button>
  );
}
