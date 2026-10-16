'use client';

import { useMemo, type ReactNode } from 'react';
import { Copy, Terminal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLogEntries, clearLogs, type LogEntry } from '@/lib/logCapture';
import { Button } from '@/components/ui/button';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { LogView, logRowText, type LogRow } from '@/components/debug/LogView';

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

export function toConsoleRow(e: LogEntry): LogRow {
  const level = e.level === 'error' ? 'err' : e.level;
  return {
    id: e.id,
    time: formatTime(e.timestamp),
    level,
    levelLabel: e.level === 'error' ? 'ERROR' : e.level.toUpperCase(),
    source: e.tag ? e.tag.replace(/^\[|\]$/g, '') : 'app',
    message: e.tag ? e.message.slice(e.tag.length).trimStart() : e.message,
  };
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'err', label: 'Errors', level: 'err' as const },
  { value: 'warn', label: 'Warnings', level: 'warn' as const },
  { value: 'info', label: 'Info', level: 'info' as const },
  { value: 'log', label: 'Log', level: 'log' as const },
];

export function ConsoleViewer({ tabs }: { tabs: ReactNode }) {
  const entries = useLogEntries();
  const rows = useMemo(() => entries.map(toConsoleRow).reverse(), [entries]);

  const copyAll = async (visible: LogRow[]) => {
    try {
      await navigator.clipboard.writeText(visible.map(logRowText).join('\n'));
      toast.success(`Copied ${visible.length} ${visible.length === 1 ? 'entry' : 'entries'}`);
    } catch (err) {
      console.error('[data] Copy console log failed:', err);
    }
  };

  return (
    <LogView
      title="Debug"
      barStart={tabs}
      rows={rows}
      filters={FILTERS}
      filterLabel="Level"
      searchPlaceholder="Search logs…"
      empty={{ icon: Terminal, title: 'No log entries', description: 'Nothing matches this search or level.' }}
      actions={(visible) => (
        <>
          <Button variant="outline" onClick={() => copyAll(visible)} disabled={visible.length === 0}>
            <Copy size={13} />
            Copy all
          </Button>
          <ConfirmPopover message={`Clear all ${entries.length} log entries?`} confirmLabel="Clear" onConfirm={clearLogs}>
            <Button variant="outline" disabled={entries.length === 0}>
              <Trash2 size={13} />
              Clear
            </Button>
          </ConfirmPopover>
        </>
      )}
    />
  );
}
