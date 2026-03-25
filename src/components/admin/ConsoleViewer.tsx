'use client';

import { useState, useMemo } from 'react';
import { useLogEntries, clearLogs, type LogLevel } from '@/lib/logCapture';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEVEL_STYLES: Record<LogLevel, { bg: string; text: string; label: string }> = {
  log: { bg: 'bg-muted/50', text: 'text-muted-foreground', label: 'LOG' },
  info: { bg: 'bg-primary/10', text: 'text-primary', label: 'INFO' },
  warn: { bg: 'bg-warning/20', text: 'text-warning', label: 'WARN' },
  error: { bg: 'bg-destructive/15', text: 'text-destructive', label: 'ERR' },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

export function ConsoleViewer() {
  const entries = useLogEntries();
  const [levelFilter, setLevelFilter] = useState<'all' | LogLevel>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const result = entries.filter((e) => {
      if (levelFilter !== 'all' && e.level !== levelFilter) return false;
      if (q && !e.message.toLowerCase().includes(q)) return false;
      return true;
    });
    return result.reverse();
  }, [entries, levelFilter, searchQuery]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Console</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}
            {entries.length !== filtered.length && ` of ${entries.length} total`}
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={clearLogs}>
          <Trash2 size={12} />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <Input
            placeholder="Search logs…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 pr-7 text-xs bg-card shadow-sm border-border/70 rounded-lg"
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery('')}
            >
              <X size={12} />
            </button>
          )}
        </div>
        <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as 'all' | LogLevel)}>
          <SelectTrigger className="h-8 w-[110px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="log">Log</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warn">Warn</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        className="rounded-xl border border-border/60 bg-card overflow-y-auto shadow-sm"
        style={{ maxHeight: 'calc(100vh - 320px)', minHeight: '300px' }}
      >
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-xs text-muted-foreground">No log entries captured.</p>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((entry) => {
              const style = LEVEL_STYLES[entry.level];
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'flex items-start gap-2 px-3 py-1.5 font-mono text-[11px] leading-relaxed',
                    entry.level === 'error' && 'bg-destructive/5',
                    entry.level === 'warn' && 'bg-warning/5'
                  )}
                >
                  <span className="text-muted-foreground/60 shrink-0 tabular-nums select-none">
                    {formatTime(entry.timestamp)}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded px-1 py-0.5 text-[9px] font-bold leading-none uppercase select-none',
                      style.bg, style.text
                    )}
                  >
                    {style.label}
                  </span>
                  {entry.tag && (
                    <span className="text-primary/70 shrink-0 select-none">{entry.tag}</span>
                  )}
                  <span className="text-foreground/90 break-all whitespace-pre-wrap min-w-0">
                    {entry.tag ? entry.message.slice(entry.tag.length).trimStart() : entry.message}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
