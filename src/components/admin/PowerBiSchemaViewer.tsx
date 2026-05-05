'use client';

import { useMemo, useState } from 'react';
import { Loader2, RefreshCw, Copy, Check, Search, AlertCircle, Database, Calculator, Link2, Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getAccessToken } from '@/lib/auth/authHelpers';
import { powerBiRequest } from '@/lib/auth/msalConfig';
import {
  scanPowerBiSchema,
  type PowerBiSchema,
  type SchemaTable,
  type SchemaColumn,
  type SchemaMeasure,
  type SchemaRelationship,
} from '@/lib/integrations/powerbi/schemaScanner';
import { cn } from '@/lib/utils';

type SectionId = 'tables' | 'columns' | 'measures' | 'relationships';

const SECTIONS: { id: SectionId; label: string; icon: typeof Database }[] = [
  { id: 'tables', label: 'Tables', icon: Database },
  { id: 'columns', label: 'Columns', icon: Columns3 },
  { id: 'measures', label: 'Measures', icon: Calculator },
  { id: 'relationships', label: 'Relationships', icon: Link2 },
];

export function PowerBiSchemaViewer() {
  const [schema, setSchema] = useState<PowerBiSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<SectionId>('tables');
  const [search, setSearch] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [copied, setCopied] = useState(false);

  async function runScan() {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken(powerBiRequest.scopes);
      if (!token) {
        setError('No PowerBI access token. Sign in again to grant Dataset.Read.All scope.');
        return;
      }
      const result = await scanPowerBiSchema(token);
      setSchema(result);
      console.log(
        `[powerbi-schema] Scanned: ${result.tables.length} tables, ${result.columns.length} columns, ${result.measures.length} measures, ${result.relationships.length} relationships`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Schema scan failed';
      console.error('[powerbi-schema] Scan failed:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function copyJson() {
    if (!schema) return;
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">PowerBI Semantic Model</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Scan dataset schema to discover available tables, columns, and measures for dashboarding.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {schema && (
            <Button size="sm" variant="ghost" onClick={copyJson}>
              {copied ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </Button>
          )}
          <Button size="sm" onClick={runScan} disabled={loading}>
            {loading ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <RefreshCw size={14} className="mr-1.5" />
            )}
            {schema ? 'Rescan' : 'Scan model'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!schema && !loading && !error && (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          Click <span className="font-medium text-foreground">Scan model</span> to fetch the semantic schema from PowerBI.
        </div>
      )}

      {schema && (
        <>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <SummaryCard label="Tables" value={schema.tables.filter((t) => !t.isHidden).length} total={schema.tables.length} />
            <SummaryCard label="Columns" value={schema.columns.filter((c) => !c.isHidden).length} total={schema.columns.length} />
            <SummaryCard label="Measures" value={schema.measures.filter((m) => !m.isHidden).length} total={schema.measures.length} />
            <SummaryCard label="Relationships" value={schema.relationships.length} />
          </div>

          <div className="flex items-center gap-2 border-b border-border">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors',
                  section === id
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon size={13} />
                {label}
                <span className="text-muted-foreground/70">
                  ({sectionCount(schema, id, showHidden)})
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter…"
                className="h-8 pl-8 text-xs"
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
                className="cursor-pointer"
              />
              Show hidden
            </label>
          </div>

          <div className="rounded-md border border-border overflow-hidden">
            {section === 'tables' && <TablesList items={filterTables(schema.tables, search, showHidden)} />}
            {section === 'columns' && <ColumnsList items={filterColumns(schema.columns, search, showHidden)} />}
            {section === 'measures' && <MeasuresList items={filterMeasures(schema.measures, search, showHidden)} />}
            {section === 'relationships' && <RelationshipsList items={filterRelationships(schema.relationships, search)} />}
          </div>
        </>
      )}
    </div>
  );
}

function sectionCount(schema: PowerBiSchema, section: SectionId, showHidden: boolean): number {
  switch (section) {
    case 'tables':
      return showHidden ? schema.tables.length : schema.tables.filter((t) => !t.isHidden).length;
    case 'columns':
      return showHidden ? schema.columns.length : schema.columns.filter((c) => !c.isHidden).length;
    case 'measures':
      return showHidden ? schema.measures.length : schema.measures.filter((m) => !m.isHidden).length;
    case 'relationships':
      return schema.relationships.length;
  }
}

function filterTables(items: SchemaTable[], q: string, showHidden: boolean): SchemaTable[] {
  const lower = q.trim().toLowerCase();
  return items.filter((t) => {
    if (!showHidden && t.isHidden) return false;
    if (lower && !t.name.toLowerCase().includes(lower)) return false;
    return true;
  });
}

function filterColumns(items: SchemaColumn[], q: string, showHidden: boolean): SchemaColumn[] {
  const lower = q.trim().toLowerCase();
  return items.filter((c) => {
    if (!showHidden && c.isHidden) return false;
    if (lower && !`${c.tableName}.${c.name}`.toLowerCase().includes(lower)) return false;
    return true;
  });
}

function filterMeasures(items: SchemaMeasure[], q: string, showHidden: boolean): SchemaMeasure[] {
  const lower = q.trim().toLowerCase();
  return items.filter((m) => {
    if (!showHidden && m.isHidden) return false;
    if (lower && !`${m.tableName}.${m.name} ${m.expression}`.toLowerCase().includes(lower)) return false;
    return true;
  });
}

function filterRelationships(items: SchemaRelationship[], q: string): SchemaRelationship[] {
  const lower = q.trim().toLowerCase();
  return items.filter((r) => {
    if (!lower) return true;
    return `${r.fromTable}.${r.fromColumn} ${r.toTable}.${r.toColumn}`.toLowerCase().includes(lower);
  });
}

function SummaryCard({ label, value, total }: { label: string; value: number; total?: number }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-lg font-semibold tabular-nums">{value}</span>
        {total !== undefined && total !== value && (
          <span className="text-xs text-muted-foreground">/ {total}</span>
        )}
      </div>
    </div>
  );
}

function TablesList({ items }: { items: SchemaTable[] }) {
  if (items.length === 0) return <EmptyRow />;
  return (
    <div className="divide-y divide-border">
      {items.map((t) => (
        <div key={t.id} className="flex items-center gap-3 px-3 py-2 text-xs">
          <Database size={13} className="text-muted-foreground shrink-0" />
          <span className="font-mono font-medium">{t.name}</span>
          {t.isHidden && <Badge variant="outline" className="text-[10px] h-4">hidden</Badge>}
          {t.dataCategory && <Badge variant="outline" className="text-[10px] h-4">{t.dataCategory}</Badge>}
          {t.description && <span className="text-muted-foreground truncate">{t.description}</span>}
        </div>
      ))}
    </div>
  );
}

function ColumnsList({ items }: { items: SchemaColumn[] }) {
  if (items.length === 0) return <EmptyRow />;
  return (
    <div className="divide-y divide-border max-h-[600px] overflow-auto">
      {items.map((c) => (
        <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 text-xs">
          <span className="font-mono text-muted-foreground">{c.tableName}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="font-mono font-medium">{c.name}</span>
          <Badge variant="outline" className="text-[10px] h-4 ml-auto">{c.dataType}</Badge>
          {c.isKey && <Badge variant="secondary" className="text-[10px] h-4">key</Badge>}
          {c.isHidden && <Badge variant="outline" className="text-[10px] h-4">hidden</Badge>}
        </div>
      ))}
    </div>
  );
}

function MeasuresList({ items }: { items: SchemaMeasure[] }) {
  if (items.length === 0) return <EmptyRow />;
  return (
    <div className="divide-y divide-border max-h-[600px] overflow-auto">
      {items.map((m) => (
        <details key={m.id} className="px-3 py-2 text-xs group">
          <summary className="flex items-center gap-2 cursor-pointer list-none">
            <Calculator size={12} className="text-muted-foreground shrink-0" />
            <span className="font-mono text-muted-foreground">{m.tableName}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-mono font-medium">{m.name}</span>
            {m.displayFolder && (
              <Badge variant="outline" className="text-[10px] h-4">{m.displayFolder}</Badge>
            )}
            <Badge variant="outline" className="text-[10px] h-4 ml-auto">{m.dataType}</Badge>
            {m.isHidden && <Badge variant="outline" className="text-[10px] h-4">hidden</Badge>}
          </summary>
          <pre className="mt-2 ml-5 p-2 bg-muted/40 rounded text-[11px] font-mono whitespace-pre-wrap break-words">
            {m.expression}
          </pre>
          {m.description && (
            <p className="mt-1 ml-5 text-muted-foreground italic">{m.description}</p>
          )}
        </details>
      ))}
    </div>
  );
}

function RelationshipsList({ items }: { items: SchemaRelationship[] }) {
  if (items.length === 0) return <EmptyRow />;
  return (
    <div className="divide-y divide-border max-h-[600px] overflow-auto">
      {items.map((r) => (
        <div key={r.id} className="flex items-center gap-2 px-3 py-1.5 text-xs">
          <span className="font-mono">{r.fromTable}</span>
          <span className="text-muted-foreground">[{r.fromColumn}]</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-mono">{r.toTable}</span>
          <span className="text-muted-foreground">[{r.toColumn}]</span>
          <Badge variant="outline" className="text-[10px] h-4 ml-auto">{r.cardinality}</Badge>
          {!r.isActive && <Badge variant="outline" className="text-[10px] h-4">inactive</Badge>}
        </div>
      ))}
    </div>
  );
}

function EmptyRow() {
  return <div className="px-3 py-6 text-center text-xs text-muted-foreground">No matches.</div>;
}
