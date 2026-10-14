'use client';

import { useMemo, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Check, Copy, Search, X } from 'lucide-react';
import { ViewBar, ViewBarSpacer } from '@/components/ui/view-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { FullBleed } from '@/components/ui/full-bleed';
import { cn } from '@/lib/utils';

export type LogRowLevel = 'log' | 'info' | 'warn' | 'err';

export interface LogRow {
  id: string | number;
  time: string;
  level: LogRowLevel;
  levelLabel: string;
  source: string;
  message: string;
  detail?: string;
}

interface LogFilter {
  value: string;
  label: string;
  /** Rows of this level match; omit for "All". */
  level?: LogRowLevel;
}

interface Props {
  title: ReactNode;
  rows: LogRow[];
  filters: LogFilter[];
  filterLabel: string;
  searchPlaceholder: string;
  empty: { icon: LucideIcon; title: string; description: string };
  /** Toolbar items right after the title (tabs). */
  barStart?: ReactNode;
  /** Toolbar actions on the right; receives the rows currently shown. */
  actions?: (visible: LogRow[]) => ReactNode;
  levelHeader?: string;
  sourceHeader?: string;
}

const LEVEL_BADGE: Record<LogRowLevel, string> = {
  log: 'bg-sunken text-muted-foreground',
  info: 'bg-info/15 text-info',
  warn: 'bg-warning/15 text-warning',
  err: 'bg-destructive/15 text-destructive',
};

const LEVEL_DOT: Record<LogRowLevel, string> = {
  log: 'bg-faint',
  info: 'bg-info',
  warn: 'bg-warning',
  err: 'bg-destructive',
};

export const logRowText = (r: LogRow) => `${r.time} ${r.levelLabel} [${r.source}] ${r.message}${r.detail ? `\n${r.detail}` : ''}`;

function LevelBadge({ level, label }: { level: LogRowLevel; label: string }) {
  return (
    <span className={cn('inline-flex h-[18px] items-center rounded px-1.5 font-sans text-[10.5px] font-semibold tracking-[0.03em]', LEVEL_BADGE[level])}>
      {label}
    </span>
  );
}

/** Console-style log table: level filter and search on top, the selected entry in full at the bottom. */
export function LogView({ title, rows, filters, filterLabel, searchPlaceholder, empty, barStart, actions, levelHeader = 'Level', sourceHeader = 'Source' }: Props) {
  const [filter, setFilter] = useState(filters[0]?.value ?? 'all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<LogRow['id'] | null>(null);
  const [copied, setCopied] = useState(false);

  const visible = useMemo(() => {
    const level = filters.find((f) => f.value === filter)?.level;
    const q = query.trim().toLowerCase();
    return rows.filter((r) => (!level || r.level === level) && (!q || `${r.source} ${r.message}`.toLowerCase().includes(q)));
  }, [rows, filters, filter, query]);

  const selected = visible.find((r) => r.id === selectedId) ?? visible[0] ?? null;

  const copy = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(logRowText(selected));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('[data] Copy log entry failed:', err);
    }
  };

  const cols = 'grid grid-cols-[minmax(96px,128px)_76px_minmax(90px,150px)_minmax(0,1fr)] items-center gap-3 px-4';

  return (
    <>
      <ViewBar title={title}>
        {barStart}
        <ViewBarSpacer />
        {actions?.(visible)}
      </ViewBar>
      <FullBleed className="grid grid-rows-[auto_minmax(0,1fr)_auto] bg-card">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-border px-4 py-2">
          <div className="relative min-w-[200px] max-w-[420px] flex-1">
            <Search size={14} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-faint" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="pl-7 pr-7" />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            )}
          </div>
          <div role="group" aria-label={filterLabel} className="inline-flex shrink-0 rounded-md border border-border-strong bg-card p-0.5">
            {filters.map((f) => {
              const count = f.level ? rows.filter((r) => r.level === f.level).length : rows.length;
              return (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={filter === f.value}
                  onClick={() => setFilter(f.value)}
                  className="inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded px-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-accent aria-pressed:text-accent-foreground"
                >
                  {f.level && <span className={cn('size-[7px] rounded-full', LEVEL_DOT[f.level])} />}
                  {f.label} <span className="tabular-nums text-faint">{count}</span>
                </button>
              );
            })}
          </div>
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
            {visible.length} of {rows.length} entries
          </span>
        </div>

        <div className="min-h-0 overflow-auto">
          {visible.length === 0 ? (
            <EmptyState icon={empty.icon} title={empty.title} description={empty.description} className="py-16" />
          ) : (
            <table className="w-full font-mono text-xs">
              <thead className="sticky top-0 z-[1] bg-surface-2">
                <tr className={cn(cols, 'h-[30px] border-b border-border font-sans text-[11.5px] font-medium text-muted-foreground')}>
                  <th className="text-left font-medium">Time</th>
                  <th className="text-left font-medium">{levelHeader}</th>
                  <th className="text-left font-medium">{sourceHeader}</th>
                  <th className="text-left font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const isSel = selected?.id === r.id;
                  return (
                    <tr
                      key={r.id}
                      aria-selected={isSel}
                      tabIndex={0}
                      onClick={() => setSelectedId(r.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(r.id); } }}
                      className={cn(
                        cols,
                        'h-8 cursor-default whitespace-nowrap border-b border-border transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring',
                        isSel && 'bg-accent shadow-[inset_3px_0_0_hsl(var(--primary))] hover:bg-accent',
                      )}
                    >
                      <td className="tabular-nums text-muted-foreground">{r.time}</td>
                      <td><LevelBadge level={r.level} label={r.levelLabel} /></td>
                      <td className="truncate text-accent-foreground">{r.source}</td>
                      <td className={cn('truncate', r.level === 'err' && 'text-destructive', r.level === 'warn' && 'text-warning')}>{r.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <section aria-label="Selected entry" className="grid gap-2 border-t border-border bg-surface-2 px-4 pb-3 pt-2.5">
            <div className="flex items-center gap-2.5 font-mono text-xs">
              <LevelBadge level={selected.level} label={selected.levelLabel} />
              <span className="tabular-nums">{selected.time}</span>
              <span className="text-accent-foreground">[{selected.source}]</span>
              <span className="flex-1" />
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <pre className="max-h-[140px] select-text overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-sunken px-3 py-2 font-mono text-xs">
              {selected.message}
              {selected.detail ? `\n${selected.detail}` : ''}
            </pre>
          </section>
        )}
      </FullBleed>
    </>
  );
}
