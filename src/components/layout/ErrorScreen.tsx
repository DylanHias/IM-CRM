'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WindowFrame } from './WindowFrame';

interface ErrorScreenProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
  retryLabel?: string;
}

export function ErrorScreen({
  title,
  description,
  onRetry,
  retrying = false,
  retryLabel = 'Retry',
}: ErrorScreenProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <WindowFrame />
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="flex max-w-md flex-col items-center gap-3 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <p className="text-[15px] font-semibold text-foreground">{title}</p>
            {description && (
              <p className="max-w-[46ch] break-words text-[13px] text-muted-foreground">{description}</p>
            )}
          </div>
          {onRetry && (
            <Button onClick={onRetry} disabled={retrying} size="sm">
              {retrying ? `${retryLabel}…` : retryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
