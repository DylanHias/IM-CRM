'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
    <Dialog open onOpenChange={() => setEntry(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Changelog</DialogTitle>
          <DialogDescription>What&apos;s new in v{entry.version}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          {entry.items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary mt-0.5 shrink-0">&#8226;</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
