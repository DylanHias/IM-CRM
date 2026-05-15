#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const CSV_DIR = resolve(REPO_ROOT, 'docs/powerbi-schema');
const OUT_PATH = resolve(REPO_ROOT, 'src/lib/integrations/powerbi/schemaSnapshot.json');

const DATA_TYPE_MAP = {
  1: 'Automatic',
  2: 'String',
  6: 'Int64',
  8: 'Decimal',
  9: 'DateTime',
  10: 'Decimal',
  11: 'Boolean',
  17: 'Double',
  19: 'Variant',
  20: 'Binary',
};
const CARDINALITY_MAP = { 1: 'OneToMany', 2: 'ManyToOne', 3: 'OneToOne', 4: 'ManyToMany' };
const CROSS_FILTER_MAP = { 1: 'OneDirection', 2: 'BothDirections', 3: 'Automatic' };

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field);
        field = '';
      } else if (c === '\r') {
        // skip
      } else if (c === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift();
  return rows
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, idx) => [h, r[idx]])));
}

const toBool = (v) => v === 'True' || v === 'true' || v === '1';
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const orNull = (v) => (v === '' || v === undefined ? null : v);

function load(name) {
  return parseCsv(readFileSync(resolve(CSV_DIR, name), 'utf8'));
}

const tablesRaw = load('TMSCHEMA_TABLES.csv');
const columnsRaw = load('TMSCHEMA_COLUMNS.csv');
const measuresRaw = load('TMSCHEMA_MEASURES.csv');
const relRaw = load('TMSCHEMA_RELATIONSHIPS.csv');

const tables = tablesRaw.map((r) => ({
  id: toNum(r.ID),
  name: r.Name ?? '',
  description: orNull(r.Description),
  isHidden: toBool(r.IsHidden),
  dataCategory: orNull(r.DataCategory),
}));

const tableNameById = new Map(tables.map((t) => [t.id, t.name]));

const columns = columnsRaw.map((r) => {
  const tableId = toNum(r.TableID);
  const dtNum = toNum(r.ExplicitDataType) || toNum(r.InferredDataType);
  return {
    id: toNum(r.ID),
    tableId,
    tableName: tableNameById.get(tableId) ?? `#${tableId}`,
    name: r.ExplicitName || r.InferredName || '',
    explicitName: orNull(r.ExplicitName),
    dataType: DATA_TYPE_MAP[dtNum] ?? `Type${dtNum}`,
    isHidden: toBool(r.IsHidden),
    isKey: toBool(r.IsKey),
    description: orNull(r.Description),
    formatString: orNull(r.FormatString),
  };
});

const measures = measuresRaw.map((r) => {
  const tableId = toNum(r.TableID);
  const dtNum = toNum(r.DataType);
  return {
    id: toNum(r.ID),
    tableId,
    tableName: tableNameById.get(tableId) ?? `#${tableId}`,
    name: r.Name ?? '',
    expression: r.Expression ?? '',
    dataType: DATA_TYPE_MAP[dtNum] ?? `Type${dtNum}`,
    description: orNull(r.Description),
    formatString: orNull(r.FormatString),
    isHidden: toBool(r.IsHidden),
    displayFolder: orNull(r.DisplayFolder),
  };
});

const columnById = new Map(columns.map((c) => [c.id, c]));

const relationships = relRaw.map((r) => {
  const fromCol = columnById.get(toNum(r.FromColumnID));
  const toCol = columnById.get(toNum(r.ToColumnID));
  return {
    id: toNum(r.ID),
    fromTable: fromCol?.tableName ?? '',
    fromColumn: fromCol?.name ?? '',
    toTable: toCol?.tableName ?? '',
    toColumn: toCol?.name ?? '',
    isActive: toBool(r.IsActive),
    crossFilter: CROSS_FILTER_MAP[toNum(r.CrossFilteringBehavior)] ?? 'Unknown',
    cardinality: CARDINALITY_MAP[toNum(r.FromCardinality)] ?? 'Unknown',
  };
});

const snapshot = {
  scannedAt: new Date().toISOString(),
  source: 'snapshot',
  datasetId: '44da76a4-3c3f-44a8-abe9-48ff17247cc9',
  workspaceId: 'abf433e0-0d86-4fef-ad42-5431e350f410',
  tables,
  columns,
  measures,
  relationships,
};

writeFileSync(OUT_PATH, JSON.stringify(snapshot, null, 2) + '\n');
console.log(
  `Wrote ${OUT_PATH}\n  tables: ${tables.length}\n  columns: ${columns.length}\n  measures: ${measures.length}\n  relationships: ${relationships.length}`,
);
