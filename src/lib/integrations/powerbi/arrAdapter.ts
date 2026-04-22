import { executeDaxQuery } from './client';
import type { ArrUpdate } from '@/lib/db/queries/customers';

const WORKSPACE_ID = process.env.NEXT_PUBLIC_POWERBI_WORKSPACE_ID ?? '';
const DATASET_ID =
  process.env.NEXT_PUBLIC_POWERBI_DATASET_ID ?? '44da76a4-3c3f-44a8-abe9-48ff17247cc9';

const BCN_COLUMN = process.env.NEXT_PUBLIC_POWERBI_BCN_COLUMN ?? "'Customer'[bcn]";
const ARR_MEASURE = process.env.NEXT_PUBLIC_POWERBI_ARR_MEASURE ?? '[ARR LC]';
const CURRENCY_COLUMN = process.env.NEXT_PUBLIC_POWERBI_CURRENCY_COLUMN ?? "'Customer'[currency_code]";

function buildArrDax(): string {
  const groupBys = CURRENCY_COLUMN ? `${BCN_COLUMN}, ${CURRENCY_COLUMN}` : BCN_COLUMN;
  return `EVALUATE FILTER(SUMMARIZECOLUMNS(${groupBys}, "ARR", ${ARR_MEASURE}), NOT ISBLANK([ARR]))`;
}

function extractColumn(row: Record<string, unknown>, column: string): unknown {
  if (column in row) return row[column];
  const bare = column.replace(/^'?[^']+'?\[/, '[');
  if (bare in row) return row[bare];
  const nested = column.replace(/^'([^']+)'\[([^\]]+)\]$/, '$1[$2]');
  if (nested in row) return row[nested];
  return undefined;
}

export async function fetchArrByBcn(token: string): Promise<ArrUpdate[]> {
  const dax = buildArrDax();
  const { rows } = await executeDaxQuery(token, WORKSPACE_ID || null, DATASET_ID, dax);

  const results: ArrUpdate[] = [];
  for (const row of rows) {
    const bcnRaw = extractColumn(row, BCN_COLUMN);
    const arrRaw = extractColumn(row, '[ARR]');
    const currencyRaw = CURRENCY_COLUMN ? extractColumn(row, CURRENCY_COLUMN) : null;

    if (bcnRaw === null || bcnRaw === undefined || bcnRaw === '') continue;
    if (typeof arrRaw !== 'number' || !Number.isFinite(arrRaw)) continue;

    results.push({
      bcn: String(bcnRaw).trim(),
      arr: arrRaw,
      currency: typeof currencyRaw === 'string' && currencyRaw.length > 0 ? currencyRaw : 'USD',
    });
  }

  // Dedupe by BCN (take max arr if model returned multiple rows per BCN with different currencies)
  const map = new Map<string, ArrUpdate>();
  for (const entry of results) {
    const existing = map.get(entry.bcn);
    if (!existing || entry.arr > existing.arr) map.set(entry.bcn, entry);
  }
  return Array.from(map.values());
}
