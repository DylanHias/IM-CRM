'use client';

import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiChat } from './AiChat';

export function AiChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[380px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-7rem)] shadow-2xl rounded-2xl animate-in fade-in slide-in-from-bottom-2 zoom-in-95 duration-200">
          <AiChat />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={open ? 'Close assistant' : 'Open assistant'}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        className={cn(
          'flex items-center justify-center h-14 w-14 self-end rounded-full bg-primary text-primary-foreground',
          'shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>
    </div>
  );
}
