'use client';

import { useState } from 'react';
import { CloudOff, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { pickAndImportRevenueCache } from '@/lib/integrations/powerbi/revenueCacheTransfer';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  message?: string;
}

export function PowerBiUnavailable({
  className,
  message = 'No connection to Power BI. Ask a colleague who has access to export their cache and import the file here.',
}: Props) {
  const [isImporting, setIsImporting] = useState(false);

  async function handleImport() {
    if (isImporting) return;
    setIsImporting(true);
    try {
      await pickAndImportRevenueCache();
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-md border border-dashed border-border bg-muted/30 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <CloudOff size={14} className="mt-0.5 shrink-0" />
        <span className="break-words">{message}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleImport}
        disabled={isImporting}
        className="h-7 px-2 text-xs shrink-0"
      >
        {isImporting ? (
          <Loader2 size={11} className="mr-1 animate-spin" />
        ) : (
          <Upload size={11} className="mr-1" />
        )}
        {isImporting ? 'Importing…' : 'Import data'}
      </Button>
    </div>
  );
}
