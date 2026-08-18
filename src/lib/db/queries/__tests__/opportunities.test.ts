import { describe, it, expect, vi, beforeEach } from 'vitest';

const select = vi.fn();
const execute = vi.fn();

vi.mock('@/lib/db/client', () => ({
  getDb: vi.fn(async () => ({ select, execute })),
}));

import { insertOpportunity, updateOpportunity } from '@/lib/db/queries/opportunities';
import { createOpportunity } from '@/__tests__/mocks/factories';

/** Column list of an `INSERT INTO opportunities (...)` statement, in order. */
function insertColumns(sql: string): string[] {
  const cols = sql.slice(sql.indexOf('(') + 1, sql.indexOf(')'));
  return cols.split(',').map((c) => c.trim());
}

/** Placeholder index of `column=$N` in an UPDATE SET clause, zero-based. */
function updateParamIndex(sql: string, column: string): number {
  const match = new RegExp(`\\b${column}=\\$(\\d+)`).exec(sql);
  if (!match) throw new Error(`no placeholder for ${column}`);
  return Number(match[1]) - 1;
}

const opp = createOpportunity({
  estimatedMargin: 42.5,
  secondaryOwnerId: 'owner-1',
  secondaryOwnerName: 'Owner One',
  estimatedMRR: 100,
});

describe('opportunity writes keep params aligned with columns', () => {
  beforeEach(() => {
    select.mockReset();
    execute.mockReset();
    select.mockResolvedValue([]);
    execute.mockResolvedValue({ rowsAffected: 1, lastInsertId: 0 });
  });

  it('insertOpportunity binds each trailing column to its own value', async () => {
    await insertOpportunity(opp);
    const [sql, params] = execute.mock.calls[0] as [string, unknown[]];
    const columns = insertColumns(sql);

    expect(columns.length).toBe(params.length);
    expect(params[columns.indexOf('estimated_margin')]).toBe(42.5);
    expect(params[columns.indexOf('secondary_owner_id')]).toBe('owner-1');
    expect(params[columns.indexOf('secondary_owner_name')]).toBe('Owner One');
    expect(params[columns.indexOf('estimated_mrr')]).toBe(100);
  });

  it('updateOpportunity binds each trailing column to its own value', async () => {
    await updateOpportunity(opp);
    const [sql, params] = execute.mock.calls[0] as [string, unknown[]];

    expect(params[updateParamIndex(sql, 'estimated_margin')]).toBe(42.5);
    expect(params[updateParamIndex(sql, 'secondary_owner_id')]).toBe('owner-1');
    expect(params[updateParamIndex(sql, 'secondary_owner_name')]).toBe('Owner One');
    expect(params[updateParamIndex(sql, 'estimated_mrr')]).toBe(100);
  });
});
