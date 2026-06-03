'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiChat } from './AiChat';

export function AiChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Edge tab button — attached to the right side */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={open ? 'Close assistant' : 'Open assistant'}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        className={cn(
          'fixed right-0 top-[80%] -translate-y-1/2 z-50 flex items-center justify-center',
          'h-16 w-11 rounded-l-2xl bg-primary text-primary-foreground',
          'shadow-lg transition-all hover:w-12 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          open && 'opacity-0 pointer-events-none'
        )}
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {/* Backdrop + slide-out panel */}
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/30 animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              'absolute right-4 top-[44px] bottom-4 flex flex-col',
              'w-[640px] max-w-[calc(100vw-2rem)]',
              'shadow-2xl rounded-2xl overflow-hidden',
              'animate-in fade-in slide-in-from-right-4 duration-200'
            )}
          >
            <AiChat onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
