import { executeDaxQuery, type DaxQueryResult } from './client';

const WORKSPACE_ID = process.env.NEXT_PUBLIC_POWERBI_WORKSPACE_ID ?? '';
const DATASET_ID =
  process.env.NEXT_PUBLIC_POWERBI_DATASET_ID ?? '44da76a4-3c3f-44a8-abe9-48ff17247cc9';

export interface SchemaTable {
  id: number;
  name: string;
  description: string | null;
  isHidden: boolean;
  dataCategory: string | null;
}

export interface SchemaColumn {
  id: number;
  tableId: number;
  tableName: string;
  name: string;
  explicitName: string | null;
  dataType: string;
  isHidden: boolean;
  isKey: boolean;
  description: string | null;
  formatString: string | null;
}

export interface SchemaMeasure {
  id: number;
  tableId: number;
  tableName: string;
  name: string;
  expression: string;
  dataType: string;
  description: string | null;
  formatString: string | null;
  isHidden: boolean;
  displayFolder: string | null;
}

export interface SchemaRelationship {
  id: number;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  isActive: boolean;
  crossFilter: string;
  cardinality: string;
}

export interface PowerBiSchema {
  scannedAt: string;
  datasetId: string;
  workspaceId: string | null;
  tables: SchemaTable[];
  columns: SchemaColumn[];
  measures: SchemaMeasure[];
  relationships: SchemaRelationship[];
}

const DATA_TYPE_MAP: Record<number, string> = {
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

const CARDINALITY_MAP: Record<number, string> = {
  1: 'OneToMany',
  2: 'ManyToOne',
  3: 'OneToOne',
  4: 'ManyToMany',
};

const CROSS_FILTER_MAP: Record<number, string> = {
  1: 'OneDirection',
  2: 'BothDirections',
  3: 'Automatic',
};

function readNum(row: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v !== '' && !isNaN(Number(v))) return Number(v);
  }
  return 0;
}

function readStr(row: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = row[k];
    if (v === null || v === undefined) continue;
    const s = String(v);
    if (s !== '') return s;
  }
  return null;
}

function readBool(row: Record<string, unknown>, ...keys: string[]): boolean {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === 'boolean') return v;
    if (typeof v === 'number') return v !== 0;
    if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
  }
  return false;
}

interface EvalOutcome {
  result: DaxQueryResult | null;
  error: string | null;
}

async function tryEvaluate(token: string, dax: string): Promise<EvalOutcome> {
  try {
    return { result: await executeDaxQuery(token, WORKSPACE_ID || null, DATASET_ID, dax), error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[powerbi-schema] Query failed: ${dax.slice(0, 60)}…`, msg);
    return { result: null, error: msg };
  }
}

function isCompatLevelError(err: string): boolean {
  const lower = err.toLowerCase();
  return (
    lower.includes('info.tables') ||
    lower.includes('not recognized') ||
    lower.includes('compatibility level') ||
    lower.includes('cannot find') ||
    lower.includes('undefined function')
  );
}

export async function scanPowerBiSchema(token: string): Promise<PowerBiSchema> {
  const [tablesOut, columnsOut, measuresOut, relOut] = await Promise.all([
    tryEvaluate(token, 'EVALUATE INFO.TABLES()'),
    tryEvaluate(token, 'EVALUATE INFO.COLUMNS()'),
    tryEvaluate(token, 'EVALUATE INFO.MEASURES()'),
    tryEvaluate(token, 'EVALUATE INFO.RELATIONSHIPS()'),
  ]);

  const { result: tablesRes, error: tablesErr } = tablesOut;
  const { result: columnsRes } = columnsOut;
  const { result: measuresRes } = measuresOut;
  const { result: relRes } = relOut;

  if (!tablesRes) {
    const detail = tablesErr ?? 'unknown error';
    if (tablesErr && isCompatLevelError(tablesErr)) {
      throw new Error(
        `INFO.TABLES() not supported by this dataset (compatibility level below 1604). Upgrade the model in Power BI Desktop or use an XMLA endpoint to scan schema. Underlying error: ${detail}`,
      );
    }
    throw new Error(`Schema scan failed: ${detail}`);
  }

  const tables: SchemaTable[] = (tablesRes.rows ?? []).map((row) => ({
    id: readNum(row, '[ID]'),
    name: readStr(row, '[Name]') ?? '',
    description: readStr(row, '[Description]'),
    isHidden: readBool(row, '[IsHidden]'),
    dataCategory: readStr(row, '[DataCategory]'),
  }));

  const tableNameById = new Map(tables.map((t) => [t.id, t.name]));

  const columns: SchemaColumn[] = (columnsRes?.rows ?? []).map((row) => {
    const tableId = readNum(row, '[TableID]');
    const dtNum = readNum(row, '[ExplicitDataType]', '[InferredDataType]', '[DataType]');
    return {
      id: readNum(row, '[ID]'),
      tableId,
      tableName: tableNameById.get(tableId) ?? `#${tableId}`,
      name: readStr(row, '[ExplicitName]', '[InferredName]', '[Name]') ?? '',
      explicitName: readStr(row, '[ExplicitName]'),
      dataType: DATA_TYPE_MAP[dtNum] ?? `Type${dtNum}`,
      isHidden: readBool(row, '[IsHidden]'),
      isKey: readBool(row, '[IsKey]'),
      description: readStr(row, '[Description]'),
      formatString: readStr(row, '[FormatString]'),
    };
  });

  const measures: SchemaMeasure[] = (measuresRes?.rows ?? []).map((row) => {
    const tableId = readNum(row, '[TableID]');
    const dtNum = readNum(row, '[DataType]');
    return {
      id: readNum(row, '[ID]'),
      tableId,
      tableName: tableNameById.get(tableId) ?? `#${tableId}`,
      name: readStr(row, '[Name]') ?? '',
      expression: readStr(row, '[Expression]') ?? '',
      dataType: DATA_TYPE_MAP[dtNum] ?? `Type${dtNum}`,
      description: readStr(row, '[Description]'),
      formatString: readStr(row, '[FormatString]'),
      isHidden: readBool(row, '[IsHidden]'),
      displayFolder: readStr(row, '[DisplayFolder]'),
    };
  });

  const columnById = new Map(columns.map((c) => [c.id, c]));

  const relationships: SchemaRelationship[] = (relRes?.rows ?? []).map((row) => {
    const fromColId = readNum(row, '[FromColumnID]');
    const toColId = readNum(row, '[ToColumnID]');
    const fromCol = columnById.get(fromColId);
    const toCol = columnById.get(toColId);
    return {
      id: readNum(row, '[ID]'),
      fromTable: fromCol?.tableName ?? '',
      fromColumn: fromCol?.name ?? '',
      toTable: toCol?.tableName ?? '',
      toColumn: toCol?.name ?? '',
      isActive: readBool(row, '[IsActive]'),
      crossFilter: CROSS_FILTER_MAP[readNum(row, '[CrossFilteringBehavior]')] ?? 'Unknown',
      cardinality:
        CARDINALITY_MAP[readNum(row, '[FromCardinality]', '[ToCardinality]')] ?? 'Unknown',
    };
  });

  return {
    scannedAt: new Date().toISOString(),
    datasetId: DATASET_ID,
    workspaceId: WORKSPACE_ID || null,
    tables,
    columns,
    measures,
    relationships,
  };
}
