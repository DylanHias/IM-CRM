import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCustomerRevenueDetailStore } from '@/store/customerRevenueDetailStore';

const executeDaxMock = vi.fn();
const dbExecute = vi.fn().mockResolvedValue({ rowsAffected: 0 });
const dbSelect = vi.fn().mockResolvedValue([]);

vi.mock('../client', () => ({
  executeDaxQuery: (...args: unknown[]) => executeDaxMock(...args),
}));

vi.mock('@/lib/db/client', () => ({
  getDb: vi.fn().mockResolvedValue({
    execute: (...args: unknown[]) => dbExecute(...args),
    select: (...args: unknown[]) => dbSelect(...args),
  }),
}));

import { refreshArrMovementFromPowerBi } from '../customerRevenueDetailService';

function resetStore() {
  useCustomerRevenueDetailStore.setState({
    movementByBcn: new Map(),
    lastRefreshedAt: null,
    isHydrated: false,
  });
}

beforeEach(() => {
  executeDaxMock.mockReset();
  dbExecute.mockClear();
  dbSelect.mockReset().mockResolvedValue([]);
  resetStore();
});

describe('refreshArrMovementFromPowerBi — ARR movement populates resiliently', () => {
  it('persists rows when Reseller[bcn] is populated (happy path)', async () => {
    executeDaxMock.mockResolvedValue({
      rows: [
        {
          '[bcn]': 'BCN-001',
          "'ARR Movement'[month]": '2026-04-01T00:00:00',
          '[Upgrade_LC]': 1000,
          '[Downgrade_LC]': -200,
          '[Cancellation_LC]': -50,
          '[NewSale_LC]': 500,
        },
      ],
    });

    await refreshArrMovementFromPowerBi('token');

    const insertCalls = dbExecute.mock.calls.filter((c) =>
      String(c[0]).startsWith('INSERT OR REPLACE INTO arr_movement'),
    );
    expect(insertCalls.length).toBeGreaterThan(0);

    const state = useCustomerRevenueDetailStore.getState();
    expect(state.movementByBcn.get('BCN-001')).toEqual([
      {
        bcn: 'BCN-001',
        month: '2026-04',
        upgradeLc: 1000,
        downgradeLc: -200,
        cancellationLc: -50,
        newSaleLc: 500,
      },
    ]);
  });

  it('falls back to Reseller[bcn] if [bcn] key is missing (forward-compatible parser)', async () => {
    executeDaxMock.mockResolvedValue({
      rows: [
        {
          'Reseller[bcn]': 'BCN-FALLBACK',
          "'ARR Movement'[month]": '2026-04',
          '[Upgrade_LC]': 100,
          '[Downgrade_LC]': 0,
          '[Cancellation_LC]': 0,
          '[NewSale_LC]': 0,
        },
      ],
    });

    await refreshArrMovementFromPowerBi('token');

    const state = useCustomerRevenueDetailStore.getState();
    expect(state.movementByBcn.has('BCN-FALLBACK')).toBe(true);
    expect(state.movementByBcn.get('BCN-FALLBACK')?.[0].upgradeLc).toBe(100);
  });

  it('does NOT wipe existing snapshot when DAX returns 0 rows', async () => {
    executeDaxMock.mockResolvedValue({ rows: [] });

    await refreshArrMovementFromPowerBi('token');

    const deleteCalls = dbExecute.mock.calls.filter((c) =>
      String(c[0]).includes('DELETE FROM arr_movement'),
    );
    expect(deleteCalls).toHaveLength(0);
  });

  it('does NOT wipe existing snapshot when every row has blank bcn (broken response)', async () => {
    executeDaxMock.mockResolvedValue({
      rows: [
        {
          '[bcn]': '',
          "'ARR Movement'[month]": '2026-04',
          '[Upgrade_LC]': 100,
          '[Downgrade_LC]': 0,
          '[Cancellation_LC]': 0,
          '[NewSale_LC]': 0,
        },
      ],
    });

    await refreshArrMovementFromPowerBi('token');

    const deleteCalls = dbExecute.mock.calls.filter((c) =>
      String(c[0]).includes('DELETE FROM arr_movement'),
    );
    expect(deleteCalls).toHaveLength(0);
  });

  it('parses rows when month key comes back without table quotes (real Power BI response)', async () => {
    executeDaxMock.mockResolvedValue({
      rows: [
        {
          '[bcn]': 'BCN-REAL',
          'ARR Movement[month]': '2026-04-01T00:00:00',
          '[Upgrade_LC]': 42,
          '[Downgrade_LC]': 0,
          '[Cancellation_LC]': 0,
          '[NewSale_LC]': 0,
        },
      ],
    });

    await refreshArrMovementFromPowerBi('token');

    const state = useCustomerRevenueDetailStore.getState();
    expect(state.movementByBcn.get('BCN-REAL')?.[0].month).toBe('2026-04');
    expect(state.movementByBcn.get('BCN-REAL')?.[0].upgradeLc).toBe(42);
  });

  it('parses many rows and groups by bcn correctly', async () => {
    executeDaxMock.mockResolvedValue({
      rows: [
        {
          '[bcn]': 'A',
          "'ARR Movement'[month]": '2026-03',
          '[Upgrade_LC]': 1,
          '[Downgrade_LC]': 0,
          '[Cancellation_LC]': 0,
          '[NewSale_LC]': 0,
        },
        {
          '[bcn]': 'A',
          "'ARR Movement'[month]": '2026-04',
          '[Upgrade_LC]': 2,
          '[Downgrade_LC]': 0,
          '[Cancellation_LC]': 0,
          '[NewSale_LC]': 0,
        },
        {
          '[bcn]': 'B',
          "'ARR Movement'[month]": '2026-04',
          '[Upgrade_LC]': 3,
          '[Downgrade_LC]': 0,
          '[Cancellation_LC]': 0,
          '[NewSale_LC]': 0,
        },
      ],
    });

    await refreshArrMovementFromPowerBi('token');

    const state = useCustomerRevenueDetailStore.getState();
    expect(state.movementByBcn.get('A')).toHaveLength(2);
    expect(state.movementByBcn.get('B')).toHaveLength(1);
    expect(state.isHydrated).toBe(true);
  });
});
