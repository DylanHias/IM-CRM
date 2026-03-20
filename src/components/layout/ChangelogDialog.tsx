'use client';

import { useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isTauriApp } from '@/lib/utils/offlineUtils';

const CHANGELOG_FILE = 'pending-changelog.json';

interface ChangelogEntry {
  version: string;
  items: string[];
}

interface ChangelogPayload {
  body: string;
  version: string;
}

function parseChangelog(body: string): string[] {
  return body
    .split('\n')
    .map((line) => line.replace(/^[\s]*[-*]\s*/, '').trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('**Full Changelog'));
}

export async function storeChangelog(body: string, version: string) {
  if (isTauriApp()) {
    try {
      const { writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      await writeTextFile(CHANGELOG_FILE, JSON.stringify({ body, version }), { baseDir: BaseDirectory.AppLocalData });
    } catch (err) {
      console.error('[changelog] Failed to write changelog file:', err);
    }
  } else {
    localStorage.setItem('pending-changelog', body);
    localStorage.setItem('pending-changelog-version', version);
  }
}

async function readAndClearChangelog(): Promise<ChangelogPayload | null> {
  if (isTauriApp()) {
    try {
      const { readTextFile, remove, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      const fileExists = await exists(CHANGELOG_FILE, { baseDir: BaseDirectory.AppLocalData });
      if (!fileExists) return null;
      const raw = await readTextFile(CHANGELOG_FILE, { baseDir: BaseDirectory.AppLocalData });
      await remove(CHANGELOG_FILE, { baseDir: BaseDirectory.AppLocalData });
      return JSON.parse(raw) as ChangelogPayload;
    } catch (err) {
      console.error('[changelog] Failed to read changelog file:', err);
      return null;
    }
  } else {
    const body = localStorage.getItem('pending-changelog');
    const version = localStorage.getItem('pending-changelog-version');
    if (body && version) {
      localStorage.removeItem('pending-changelog');
      localStorage.removeItem('pending-changelog-version');
      return { body, version };
    }
    return null;
  }
}

export function ChangelogDialog() {
  const [entry, setEntry] = useState<ChangelogEntry | null>(null);

  useEffect(() => {
    const load = async () => {
      const payload = await readAndClearChangelog();
      if (payload) {
        setEntry({ version: payload.version, items: parseChangelog(payload.body) });
      }
    };
    load();
  }, []);

  if (!entry || entry.items.length === 0) return null;

  return (
    <DialogPrimitive.Root open onOpenChange={() => setEntry(null)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 top-[36px] z-50 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'sm:rounded-lg'
          )}
        >
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
              Changelog
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              What&apos;s new in v{entry.version}
            </DialogPrimitive.Description>
          </div>
          <ul className="space-y-2 text-sm">
            {entry.items.map((item, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary mt-0.5 shrink-0">&#8226;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
