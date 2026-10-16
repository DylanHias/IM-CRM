import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRevenueStore } from '@/store/revenueStore';

const executeDaxMock = vi.fn();

/**
 * Minimal stand-in for the customer_revenue table: it applies only the two
 * statement shapes refreshRevenue issues against it, so the assertions below
 * are about the rows that survive a refresh rather than about the SQL text.
 */
interface StoredRow {
  bcn: string;
  arr_lc: number | null;
  refreshed_at: string;
}

let table: StoredRow[] = [];
let customers: { id: string; name: string; bcn: string | null; account_number: null; reseller_id: null; arm_id: null }[] = [];
let failInsertCalls = new Set<number>();
let insertCallCount = 0;

const COLS_PER_ROW = 10;

async function execute(sql: string, params: unknown[] = []): Promise<{ rowsAffected: number }> {
  if (sql.includes('INSERT INTO customer_revenue')) {
    insertCallCount++;
    if (failInsertCalls.has(insertCallCount)) throw new Error('database is locked');
    const rows = params.length / COLS_PER_ROW;
    for (let i = 0; i < rows; i++) {
      const base = i * COLS_PER_ROW;
      table.push({
        bcn: String(params[base]),
        arr_lc: params[base + 5] as number | null,
        refreshed_at: String(params[base + 9]),
      });
    }
    return { rowsAffected: rows };
  }
  if (sql.includes('DELETE FROM customer_revenue')) {
    const cutoff = String(params[0]);
    const scoped = sql.includes('bcn IN') ? new Set(params.slice(1).map(String)) : null;
    table = table.filter(
      (r) => !(r.refreshed_at < cutoff && (scoped === null || scoped.has(r.bcn))),
    );
    return { rowsAffected: 0 };
  }
  return { rowsAffected: 0 };
}

async function select(sql: string): Promise<unknown[]> {
  if (sql.includes('FROM customers')) return customers;
  if (sql.includes('FROM customer_revenue')) return table;
  return [];
}

vi.mock('../client', () => ({
  executeDaxQuery: (...args: unknown[]) => executeDaxMock(...args),
}));

vi.mock('@/lib/db/client', () => ({
  getDb: vi.fn().mockResolvedValue({ execute, select }),
}));

vi.mock('../revenueInsightsService', () => ({
  refreshInsightsFromPowerBi: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../customerRevenueDetailService', () => ({
  refreshArrMovementFromPowerBi: vi.fn().mockResolvedValue(undefined),
}));

import { refreshRevenue } from '../revenueService';

function pbiRow(bcn: string, resellerId: string, arrLc: number): Record<string, unknown> {
  return {
    'Reseller[bcn]': bcn,
    'Reseller[reseller_id]': resellerId,
    'Reseller[Reseller Account]': null,
    'Reseller[marketplace_id]': null,
    'Reseller[Reseller Name]': `Reseller ${resellerId}`,
    'Reseller[currency_code]': 'EUR',
    '[ARR_USD]': arrLc * 1.1,
    '[ARR_LC]': arrLc,
    '[AsOfMonth]': '2026-09-01',
    '[ActiveEndCustomers]': 3,
  };
}

function crmCustomer(id: string, bcn: string) {
  return { id, name: `Customer ${id}`, bcn, account_number: null, reseller_id: null, arm_id: null };
}

/** Refreshes are milliseconds apart, so age the stored rows to keep `refreshed_at` ordering explicit. */
function ageExistingRows(): void {
  table = table.map((r) => ({ ...r, refreshed_at: '2000-01-01T00:00:00.000Z' }));
}

/** Makes the given 1-based inserts of the NEXT refresh throw. */
function failInsertsOfNextRefresh(...calls: number[]): void {
  insertCallCount = 0;
  failInsertCalls = new Set(calls);
}

function totalArrLcFor(bcn: string): number {
  return table.filter((r) => r.bcn === bcn).reduce((sum, r) => sum + (r.arr_lc ?? 0), 0);
}

beforeEach(() => {
  table = [];
  customers = [];
  failInsertCalls = new Set();
  insertCallCount = 0;
  executeDaxMock.mockReset();
  useRevenueStore.setState({
    byBcn: new Map(),
    byResellerAccount: new Map(),
    isRefreshing: false,
    lastRefreshedAt: null,
  });
});

describe('refreshRevenue — persisted rows', () => {
  it('keeps every Power BI row for one BCN instead of the largest, so the cache sums', async () => {
    customers = [crmCustomer('c1', 'BCN-1')];
    executeDaxMock.mockResolvedValue({
      rows: [pbiRow('BCN-1', 'R1', 1000), pbiRow('BCN-1', 'R2', 500)],
    });

    await refreshRevenue('token', { awaitSnapshots: true });

    expect(table).toHaveLength(2);
    expect(totalArrLcFor('BCN-1')).toBe(1500);
    expect(useRevenueStore.getState().byBcn.get('BCN-1')?.arrLc).toBe(1500);
  });

  it('does not double-count a BCN when an earlier chunk failed and left its old rows behind', async () => {
    // CHUNK is floor(999 / 10) = 99 rows per statement, so 100 rows span two chunks.
    const rows = Array.from({ length: 100 }, (_, i) => pbiRow(`BCN-${i}`, `R${i}`, 100));
    customers = rows.map((_, i) => crmCustomer(`c${i}`, `BCN-${i}`));
    executeDaxMock.mockResolvedValue({ rows });

    await refreshRevenue('token', { awaitSnapshots: true });
    expect(table).toHaveLength(100);

    // Second refresh: the first chunk fails, so its 99 BCNs must keep their older
    // rows, while the second chunk's BCN must be replaced rather than duplicated.
    ageExistingRows();
    failInsertsOfNextRefresh(1);
    executeDaxMock.mockResolvedValue({ rows });
    await refreshRevenue('token', { awaitSnapshots: true });

    expect(totalArrLcFor('BCN-99')).toBe(100);
    expect(totalArrLcFor('BCN-0')).toBe(100);
    expect(table).toHaveLength(100);
  });

  it('leaves the previous rows untouched when the only chunk fails', async () => {
    customers = [crmCustomer('c1', 'BCN-1')];
    executeDaxMock.mockResolvedValue({ rows: [pbiRow('BCN-1', 'R1', 900)] });
    await refreshRevenue('token', { awaitSnapshots: true });

    ageExistingRows();
    failInsertsOfNextRefresh(1);
    executeDaxMock.mockResolvedValue({ rows: [pbiRow('BCN-1', 'R1', 123)] });
    await refreshRevenue('token', { awaitSnapshots: true });

    expect(totalArrLcFor('BCN-1')).toBe(900);
  });

  it('skips rows that match no customer rather than caching them as zero', async () => {
    customers = [crmCustomer('c1', 'BCN-1')];
    executeDaxMock.mockResolvedValue({
      rows: [pbiRow('BCN-1', 'R1', 100), pbiRow('BCN-UNKNOWN', 'R9', 999)],
    });

    await refreshRevenue('token', { awaitSnapshots: true });

    expect(table.map((r) => r.bcn)).toEqual(['BCN-1']);
  });

  it('counts distinct customers, not rows, so the refresh toast is honest', async () => {
    customers = [crmCustomer('c1', 'BCN-1')];
    executeDaxMock.mockResolvedValue({
      rows: [pbiRow('BCN-1', 'R1', 1000), pbiRow('BCN-1', 'R2', 500)],
    });

    expect(await refreshRevenue('token', { awaitSnapshots: true })).toEqual({ count: 1 });
  });
});
