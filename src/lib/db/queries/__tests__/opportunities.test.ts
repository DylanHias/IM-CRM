import { describe, it, expect, vi, beforeEach } from 'vitest';

const select = vi.fn();
const execute = vi.fn();

vi.mock('@/lib/db/client', () => ({
  getDb: vi.fn(async () => ({ select, execute })),
}));

import {
  insertOpportunity,
  updateOpportunity,
  bulkUpsertOpportunities,
  upsertPulledOpportunity,
} from '@/lib/db/queries/opportunities';
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
  contactId: null,
  remoteId: 'remote-1',
  estimatedMargin: 42.5,
  estimatedMRR: 100,
  secondaryOwnerId: 'owner-1',
  secondaryOwnerName: 'Owner One',
  publicSectorSegment: 'Federal',
});

/** Values that must each land in their own column, never a neighbour's. */
const MARKERS: Record<string, unknown> = {
  estimated_margin: 42.5,
  estimated_mrr: 100,
  secondary_owner_id: 'owner-1',
  secondary_owner_name: 'Owner One',
  public_sector_segment: 'Federal',
};

function expectInsertAligned(sql: string, params: unknown[]) {
  const columns = insertColumns(sql);
  expect(columns.length).toBe(params.length);
  for (const [column, value] of Object.entries(MARKERS)) {
    expect(columns).toContain(column);
    expect(params[columns.indexOf(column)]).toBe(value);
  }
}

function expectUpdateAligned(sql: string, params: unknown[]) {
  for (const [column, value] of Object.entries(MARKERS)) {
    expect(params[updateParamIndex(sql, column)]).toBe(value);
  }
}

describe('opportunity writes keep params aligned with columns', () => {
  beforeEach(() => {
    select.mockReset();
    execute.mockReset();
    select.mockResolvedValue([]);
    execute.mockResolvedValue({ rowsAffected: 1, lastInsertId: 0 });
  });

  it('insertOpportunity', async () => {
    await insertOpportunity(opp);
    const [sql, params] = execute.mock.calls[0] as [string, unknown[]];
    expectInsertAligned(sql, params);
  });

  it('updateOpportunity', async () => {
    await updateOpportunity(opp);
    const [sql, params] = execute.mock.calls[0] as [string, unknown[]];
    expectUpdateAligned(sql, params);
  });

  it('bulkUpsertOpportunities — insert branch', async () => {
    await bulkUpsertOpportunities(
      [opp],
      new Set([opp.customerId]),
      new Set(),
      new Map(),
    );
    const [sql, params] = execute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT OR IGNORE');
    expectInsertAligned(sql, params);
  });

  it('bulkUpsertOpportunities — conflict branch', async () => {
    await bulkUpsertOpportunities(
      [opp],
      new Set([opp.customerId]),
      new Set(),
      new Map([[opp.remoteId!, { localId: opp.id, syncStatus: 'synced' }]]),
    );
    const [sql, params] = execute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('ON CONFLICT');
    expectInsertAligned(sql, params);
  });

  it('upsertPulledOpportunity — insert branch', async () => {
    select
      .mockResolvedValueOnce([])                      // no existing opportunity
      .mockResolvedValueOnce([{ id: opp.customerId }]); // customer exists
    await upsertPulledOpportunity(opp);
    const [sql, params] = execute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('INSERT INTO');
    expectInsertAligned(sql, params);
  });

  it('upsertPulledOpportunity — update branch', async () => {
    select
      .mockResolvedValueOnce([{ id: opp.id, sync_status: 'synced' }])
      .mockResolvedValueOnce([{ id: opp.customerId }]);
    await upsertPulledOpportunity(opp);
    const [sql, params] = execute.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('UPDATE opportunities');
    expectUpdateAligned(sql, params);
  });
});
