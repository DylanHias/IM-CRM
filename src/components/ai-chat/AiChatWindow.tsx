'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, Trash2, RefreshCw, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isTauriApp } from '@/lib/utils/offlineUtils';
import { useAiChatStore } from '@/store/aiChatStore';
import { useAuthStore } from '@/store/authStore';
import { streamChat, DEFAULT_MODEL } from '@/lib/ai/ollamaService';
import { buildSystemPrompt } from '@/lib/ai/systemPrompt';
import { detectAndFetchContext } from '@/lib/ai/contextDetection';
import { AiChatMessage } from './AiChatMessage';
import { Button } from '@/components/ui/button';

export function AiChatWindow() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  if (!isTauriApp() || !isAdmin) return null;

  return <AiChatWindowInner />;
}

function AiChatWindowInner() {
  const {
    isOpen,
    messages,
    isStreaming,
    streamingContent,
    ollamaStatus,
    pullProgress,
    pullStatus,
    setOpen,
    addMessage,
    updateStreamingContent,
    finalizeStreaming,
    setStreaming,
    clearMessages,
    checkOllamaAvailability,
  } = useAiChatStore();

  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chunkBufferRef = useRef('');
  const rafRef = useRef<number | undefined>(undefined);

  // Check Ollama availability when chat opens
  useEffect(() => {
    if (isOpen && ollamaStatus === 'unchecked') {
      checkOllamaAvailability();
    }
  }, [isOpen, ollamaStatus, checkOllamaAvailability]);

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, streamingContent]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, setOpen]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const flushChunks = useCallback(() => {
    updateStreamingContent(chunkBufferRef.current);
    rafRef.current = undefined;
  }, [updateStreamingContent]);

  const onChunk = useCallback(
    (text: string) => {
      chunkBufferRef.current += text;
      if (rafRef.current === undefined) {
        rafRef.current = requestAnimationFrame(flushChunks);
      }
    },
    [flushChunks]
  );

  const onDone = useCallback(() => {
    if (rafRef.current !== undefined) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }
    updateStreamingContent(chunkBufferRef.current);
    chunkBufferRef.current = '';
    finalizeStreaming();
  }, [updateStreamingContent, finalizeStreaming]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    addMessage({ role: 'user', content: text });
    setStreaming(true);
    chunkBufferRef.current = '';

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const dataContext = await detectAndFetchContext(text);
      const systemPrompt = buildSystemPrompt(dataContext ?? undefined, text);

      const history = useAiChatStore.getState().messages;
      const ollamaMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ];

      await streamChat(DEFAULT_MODEL, ollamaMessages, onChunk, onDone, controller.signal);
    } catch (err) {
      console.error('[ai] send message error:', err);
      chunkBufferRef.current = '';
      finalizeStreaming();
      addMessage({ role: 'assistant', content: 'Something went wrong. Please try again.' });
    } finally {
      abortControllerRef.current = null;
    }
  }, [input, isStreaming, addMessage, setStreaming, onChunk, onDone, finalizeStreaming]);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const autoResize = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{ transformOrigin: 'bottom right', maxHeight: 'min(520px, calc(100vh - 100px))' }}
          className="fixed bottom-6 right-6 z-40 w-[380px] flex flex-col rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-background shrink-0">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <div
                className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  ollamaStatus === 'available' && 'bg-green-500',
                  ollamaStatus === 'unavailable' && 'bg-red-500',
                  ollamaStatus === 'no-models' && 'bg-yellow-500',
                  (ollamaStatus === 'unchecked' || ollamaStatus === 'checking' || ollamaStatus === 'pulling') && 'bg-muted-foreground animate-pulse'
                )}
              />
              <span className="text-sm font-medium text-foreground">
                {ollamaStatus === 'checking' ? 'Starting…' : ollamaStatus === 'pulling' ? 'Setting up…' : 'AI Assistant'}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={clearMessages}
              title="Clear chat"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {ollamaStatus === 'unavailable' ? (
              <OllamaUnavailable onRetry={checkOllamaAvailability} />
            ) : ollamaStatus === 'pulling' ? (
              <ModelPulling progress={pullProgress} status={pullStatus} model={DEFAULT_MODEL} />
            ) : (
              <>
                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
                  {messages.length === 0 && !isStreaming && (
                    <AiChatMessage
                      message={{
                        id: 'welcome',
                        role: 'assistant',
                        content: "Hey! What can I help you with?",
                        timestamp: 0,
                      }}
                    />
                  )}
                  {messages.map((msg) => (
                    <AiChatMessage key={msg.id} message={msg} />
                  ))}
                  {isStreaming && (
                    <AiChatMessage
                      message={{ id: 'streaming', role: 'assistant', content: '', timestamp: Date.now() }}
                      isStreaming
                      streamingContent={streamingContent}
                    />
                  )}
                </div>

                {/* Input */}
                <div className="shrink-0 border-t border-border px-3 py-2.5">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={autoResize}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask a question..."
                      rows={1}
                      disabled={isStreaming || ollamaStatus !== 'available'}
                      className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 min-h-[32px] max-h-[120px] py-1.5 leading-5"
                    />
                    {isStreaming ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={stopStreaming}
                        title="Stop"
                      >
                        <Square className="h-3.5 w-3.5 fill-current" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-primary hover:text-primary/80 disabled:opacity-30"
                        onClick={sendMessage}
                        disabled={!input.trim() || ollamaStatus !== 'available'}
                        title="Send (Enter)"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OllamaUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3 px-6 text-center">
      <p className="text-sm font-medium text-foreground">AI Assistant unavailable</p>
      <p className="text-xs text-muted-foreground">
        Could not connect to Ollama. Contact your administrator.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </Button>
    </div>
  );
}

function ModelPulling({ progress, status, model }: { progress: number; status: string; model: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4 px-6 text-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Download className="h-4 w-4 animate-bounce" />
        <p className="text-sm font-medium text-foreground">Downloading AI model</p>
      </div>
      <p className="text-xs text-muted-foreground max-w-[260px]">
        Setting up <span className="font-mono">{model}</span> for the first time. This is a one-time download (~2 GB).
      </p>
      <div className="w-full max-w-[260px] space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.max(progress, 3)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="truncate max-w-[200px]">{status || 'Preparing…'}</span>
          {progress > 0 && <span>{progress}%</span>}
        </div>
      </div>
    </div>
  );
}
