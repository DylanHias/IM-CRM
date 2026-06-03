'use client';

import Markdown from 'react-markdown';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/store/aiChatStore';

interface Props {
  message: ChatMessage;
  isStreaming?: boolean;
  streamingContent?: string;
  /** Present-tense status (e.g. a running data lookup) shown while waiting for the first token. */
  statusLabel?: string;
}

export function AiChatMessage({ message, isStreaming, streamingContent, statusLabel }: Props) {
  const isUser = message.role === 'user';
  const content = isStreaming && streamingContent !== undefined ? streamingContent : message.content;
  // Collapse duplicate lookups (same label) into a single chip.
  const tools = message.tools ? Array.from(new Map(message.tools.map((t) => [t.done, t])).values()) : [];

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{content}</p>
        ) : isStreaming && !content ? (
          statusLabel ? (
            <div className="flex items-center gap-2 py-0.5 text-muted-foreground">
              <Search className="h-3.5 w-3.5 shrink-0 animate-pulse" />
              <span className="text-xs">{statusLabel}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce [animation-delay:300ms]" />
            </div>
          )
        ) : (
          <>
            {tools.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {tools.map((t) => (
                  <span
                    key={t.done}
                    className="inline-flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    <Search className="h-2.5 w-2.5 shrink-0" />
                    {t.done}
                  </span>
                ))}
              </div>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <Markdown>{content}</Markdown>
              {isStreaming && (
                <span className="inline-block w-1.5 h-3.5 bg-current opacity-70 animate-pulse ml-0.5 align-text-bottom" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
