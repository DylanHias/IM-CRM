'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const CHANGELOG_KEY = 'pending-changelog';
const CHANGELOG_VERSION_KEY = 'pending-changelog-version';

interface ChangelogEntry {
  version: string;
  items: string[];
}

function parseChangelog(body: string): string[] {
  return body
    .split('\n')
    .map((line) => line.replace(/^[\s]*[-*]\s*/, '').trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('**Full Changelog'));
}

export function storeChangelog(body: string, version: string) {
  localStorage.setItem(CHANGELOG_KEY, body);
  localStorage.setItem(CHANGELOG_VERSION_KEY, version);
}

export function ChangelogDialog() {
  const [entry, setEntry] = useState<ChangelogEntry | null>(null);

  useEffect(() => {
    const body = localStorage.getItem(CHANGELOG_KEY);
    const version = localStorage.getItem(CHANGELOG_VERSION_KEY);
    if (body && version) {
      setEntry({ version, items: parseChangelog(body) });
      localStorage.removeItem(CHANGELOG_KEY);
      localStorage.removeItem(CHANGELOG_VERSION_KEY);
    }
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
