'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Send, Square, Trash2, RefreshCw, Download, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAiChatStore } from '@/store/aiChatStore';
import { chatWithTools, DEFAULT_MODEL } from '@/lib/ai/ollamaService';
import { buildSystemPrompt, AI_NAME, AI_GREETING } from '@/lib/ai/systemPrompt';
import { detectAndFetchContext } from '@/lib/ai/contextDetection';
import { useTypewriter } from '@/lib/ai/typewriter';
import { AiChatMessage } from './AiChatMessage';
import { Button } from '@/components/ui/button';

const GREETING_MESSAGE = {
  id: 'greeting',
  role: 'assistant' as const,
  content: AI_GREETING,
  timestamp: 0,
};

export function AiChat() {
  const {
    messages,
    isStreaming,
    streamingContent,
    ollamaStatus,
    pullProgress,
    pullStatus,
    addMessage,
    updateStreamingContent,
    finalizeStreaming,
    setStreaming,
    clearMessages,
    checkOllamaAvailability,
  } = useAiChatStore();

  const [input, setInput] = useState('');
  const [complete, setComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chunkBufferRef = useRef('');
  const rafRef = useRef<number | undefined>(undefined);

  // Typewriter reveal drives the visible streaming text at a steady cadence.
  const displayed = useTypewriter(streamingContent);

  // Kick off the availability check (and lazy model pull) when the page opens.
  useEffect(() => {
    if (ollamaStatus === 'unchecked') checkOllamaAvailability();
  }, [ollamaStatus, checkOllamaAvailability]);

  // Finalize only once the typewriter has fully caught up, so the bubble never
  // snaps to its final text — it commits silently at the same content.
  useEffect(() => {
    if (!complete) return;
    if (displayed.length >= streamingContent.length) {
      finalizeStreaming();
      setComplete(false);
    }
  }, [complete, displayed, streamingContent, finalizeStreaming]);

  // Auto-scroll to the newest content.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, displayed, ollamaStatus, pullProgress]);

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

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
    setComplete(true);
  }, [updateStreamingContent]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    addMessage({ role: 'user', content: text });
    setStreaming(true);
    setComplete(false);
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

      await chatWithTools(DEFAULT_MODEL, ollamaMessages, onChunk, onDone, controller.signal);
    } catch (err) {
      console.error('[ai] send message error:', err);
      chunkBufferRef.current = '';
      finalizeStreaming();
      addMessage({ role: 'assistant', content: 'Sorry, something went wrong on my end. Please try again.' });
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
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  }, []);

  const ready = ollamaStatus === 'available';

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] rounded-2xl border border-border bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">{AI_NAME}</span>
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                ready && 'bg-green-500',
                ollamaStatus === 'unavailable' && 'bg-red-500',
                (ollamaStatus === 'unchecked' || ollamaStatus === 'checking' || ollamaStatus === 'pulling') &&
                  'bg-muted-foreground animate-pulse'
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {ollamaStatus === 'checking' || ollamaStatus === 'unchecked'
              ? 'Waking up…'
              : ollamaStatus === 'pulling'
                ? 'Setting up…'
                : ollamaStatus === 'unavailable'
                  ? 'Offline'
                  : 'Local AI assistant'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={clearMessages}
          title="Clear chat"
          disabled={messages.length === 0 && !isStreaming}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
        <AiChatMessage message={GREETING_MESSAGE} />

        {messages.map((msg) => (
          <AiChatMessage key={msg.id} message={msg} />
        ))}

        {isStreaming && (
          <AiChatMessage
            message={{ id: 'streaming', role: 'assistant', content: '', timestamp: 0 }}
            isStreaming
            streamingContent={displayed}
          />
        )}

        {ollamaStatus === 'pulling' && <ModelPullingBubble progress={pullProgress} status={pullStatus} />}
        {ollamaStatus === 'unavailable' && <UnavailableBubble onRetry={checkOllamaAvailability} />}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={autoResize}
            onKeyDown={handleKeyDown}
            placeholder={ready ? `Ask ${AI_NAME} anything…` : 'Assistant is starting up…'}
            rows={1}
            disabled={isStreaming || !ready}
            className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 min-h-[36px] max-h-[160px] py-2 leading-5"
          />
          {isStreaming ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={stopStreaming}
              title="Stop"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-primary hover:text-primary/80 disabled:opacity-30"
              onClick={sendMessage}
              disabled={!input.trim() || !ready}
              title="Send (Enter)"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ModelPullingBubble({ progress, status }: { progress: number; status: string }) {
  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm text-foreground">
        <div className="flex items-center gap-2 mb-2">
          <Download className="h-4 w-4 animate-bounce" />
          <span className="font-medium">Getting set up for the first time</span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Downloading my local model (<span className="font-mono">{DEFAULT_MODEL}</span>). This is a one-time download.
        </p>
        <div className="h-1.5 w-full rounded-full bg-background overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${Math.max(progress, 3)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span className="truncate max-w-[220px]">{status || 'Preparing…'}</span>
          {progress > 0 && <span>{progress}%</span>}
        </div>
      </div>
    </div>
  );
}

function UnavailableBubble({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2.5 text-sm text-foreground space-y-2">
        <p>I can&apos;t reach my local engine right now. Make sure the app finished starting, then try again.</p>
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      </div>
    </div>
  );
}
