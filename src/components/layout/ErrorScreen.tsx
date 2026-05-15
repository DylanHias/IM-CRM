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
        <div className="flex max-w-md flex-col items-center text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <p className="text-base font-semibold text-foreground">{title}</p>
            {description && (
              <p className="text-sm text-muted-foreground break-words">{description}</p>
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
