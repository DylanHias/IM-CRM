'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Save, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
import { getDb } from '@/lib/db/client';
import {
  querySavedQueries,
  insertSavedQuery,
  updateSavedQuery,
  deleteSavedQuery,
} from '@/lib/db/queries/savedQueries';
import type { SavedQuery } from '@/types/admin';

const MAX_DISPLAY_ROWS = 500;
const READ_PATTERN = /^\s*(SELECT|PRAGMA|EXPLAIN|WITH)\b/i;

export function DatabaseExplorer() {
  const [sql, setSql] = useState('');
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [mutationResult, setMutationResult] = useState<{ rowsAffected: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [queryName, setQueryName] = useState('');

  useEffect(() => {
    loadSavedQueries();
  }, []);

  async function loadSavedQueries() {
    try {
      const queries = await querySavedQueries();
      setSavedQueries(queries);
    } catch (err) {
      console.error('[db] Failed to load saved queries:', err);
    }
  }

  const execute = useCallback(async () => {
    const trimmed = sql.trim();
    if (!trimmed) return;

    setIsExecuting(true);
    setError(null);
    setResults(null);
    setMutationResult(null);
    setColumns([]);

    try {
      const db = await getDb();
      const isRead = READ_PATTERN.test(trimmed);
      const start = performance.now();

      if (isRead) {
        const rows = await db.select<Record<string, unknown>[]>(trimmed);
        const cols = rows.length > 0 ? Object.keys(rows[0]) : [];
        setColumns(cols);
        setResults(rows);
      } else {
        const result = await db.execute(trimmed);
        setMutationResult({ rowsAffected: result.rowsAffected });
      }

      setExecutionTimeMs(Math.round(performance.now() - start));
    } catch (err) {
      console.error('[db] Query execution error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsExecuting(false);
    }
  }, [sql]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      execute();
    }
  }

  function handleLoadQuery(id: string) {
    const numId = Number(id);
    const query = savedQueries.find((q) => q.id === numId);
    if (query) {
      setSql(query.sql);
      setSelectedQueryId(numId);
    }
  }

  async function handleSaveQuery() {
    const name = queryName.trim();
    if (!name || !sql.trim()) return;

    try {
      if (selectedQueryId) {
        await updateSavedQuery(selectedQueryId, name, sql);
      } else {
        await insertSavedQuery(name, sql);
      }
      await loadSavedQueries();
      setIsSaving(false);
      setQueryName('');
    } catch (err) {
      console.error('[db] Failed to save query:', err);
    }
  }

  async function handleDeleteQuery() {
    if (!selectedQueryId) return;
    try {
      await deleteSavedQuery(selectedQueryId);
      setSelectedQueryId(null);
      setSql('');
      await loadSavedQueries();
    } catch (err) {
      console.error('[db] Failed to delete query:', err);
    }
  }

  function formatCell(value: unknown): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  const displayRows = results ? results.slice(0, MAX_DISPLAY_ROWS) : [];
  const totalRows = results?.length ?? 0;
  const selectedQuery = savedQueries.find((q) => q.id === selectedQueryId);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">Database</h2>

      {/* Saved queries bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={selectedQueryId ?? ''}
          onChange={(e) => handleLoadQuery(e.target.value)}
          className="h-9 rounded-md border border-border/60 bg-background px-3 text-sm min-w-[200px]"
        >
          <option value="">Saved queries…</option>
          {savedQueries.map((q) => (
            <option key={q.id} value={q.id}>
              {q.name}
            </option>
          ))}
        </select>

        {selectedQueryId && (
          <ConfirmPopover
            message={`Delete "${selectedQuery?.name}"?`}
            confirmLabel="Delete"
            onConfirm={handleDeleteQuery}
            variant="destructive"
          >
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </ConfirmPopover>
        )}

        <div className="ml-auto flex items-center gap-2">
          {isSaving ? (
            <>
              <Input
                value={queryName}
                onChange={(e) => setQueryName(e.target.value)}
                placeholder="Query name"
                className="h-9 w-48"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveQuery();
                  if (e.key === 'Escape') setIsSaving(false);
                }}
              />
              <Button size="sm" onClick={handleSaveQuery} disabled={!queryName.trim() || !sql.trim()}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsSaving(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQueryName(selectedQuery?.name ?? '');
                setIsSaving(true);
              }}
              disabled={!sql.trim()}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {selectedQueryId ? 'Update' : 'Save'}
            </Button>
          )}
        </div>
      </div>

      {/* SQL editor */}
      <Textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="SELECT * FROM customers LIMIT 10;"
        className="font-mono text-sm min-h-[120px] resize-y"
      />

      {/* Execute row */}
      <div className="flex items-center gap-3">
        <Button onClick={execute} disabled={!sql.trim() || isExecuting} size="sm">
          {isExecuting ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 mr-1.5" />
          )}
          Execute
        </Button>
        <span className="text-xs text-muted-foreground">Ctrl+Enter</span>

        {executionTimeMs !== null && !error && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{executionTimeMs}ms</span>
            {results && (
              <Badge variant="secondary" className="text-xs">
                {totalRows} row{totalRows !== 1 ? 's' : ''}
              </Badge>
            )}
            {mutationResult && (
              <Badge variant="secondary" className="text-xs">
                {mutationResult.rowsAffected} row{mutationResult.rowsAffected !== 1 ? 's' : ''} affected
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3">
          <p className="font-mono text-xs text-destructive whitespace-pre-wrap">{error}</p>
        </div>
      )}

      {/* Mutation result */}
      {mutationResult && !error && (
        <div className="rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
          Query executed successfully. {mutationResult.rowsAffected} row{mutationResult.rowsAffected !== 1 ? 's' : ''} affected.
        </div>
      )}

      {/* Results table */}
      {results && columns.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
          {totalRows > MAX_DISPLAY_ROWS && (
            <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/30 border-b border-border/40">
              Showing {MAX_DISPLAY_ROWS} of {totalRows} rows
            </div>
          )}
          <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 480px)', minHeight: '200px' }}>
            <table className="w-full text-xs font-mono">
              <thead className="sticky top-0">
                <tr className="border-b border-border/70 bg-muted/30">
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {displayRows.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    {columns.map((col) => {
                      const value = row[col];
                      const isNull = value === null || value === undefined;
                      return (
                        <td
                          key={col}
                          className={`px-3 py-1.5 whitespace-nowrap max-w-[300px] truncate ${isNull ? 'italic text-muted-foreground/50' : ''}`}
                          title={formatCell(value)}
                        >
                          {formatCell(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty result set */}
      {results && columns.length === 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-4 text-sm text-muted-foreground">
          Query returned 0 rows.
        </div>
      )}
    </div>
  );
}
