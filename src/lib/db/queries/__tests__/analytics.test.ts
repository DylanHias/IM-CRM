import { describe, it, expect, vi, beforeEach } from 'vitest';

const select = vi.fn();

vi.mock('@/lib/db/client', () => ({
  getDb: vi.fn(async () => ({ select, execute: vi.fn() })),
}));

import { queryMyWinRateSince, queryMyPipelineByStage } from '@/lib/db/queries/analytics';

describe('queryMyWinRateSince', () => {
  beforeEach(() => select.mockReset());

  it('only counts deals closed on or after the given date, for the given users', async () => {
    select.mockResolvedValueOnce([
      { status: 'Won', count: 3 },
      { status: 'Lost', count: 5 },
    ]);
    const res = await queryMyWinRateSince(['u1', 'u2'], '2026-07-16T00:00:00.000Z');
    const [sql, params] = select.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('close_date >= $3');
    expect(sql).toContain("status IN ('Won', 'Lost')");
    expect(params).toEqual(['u1', 'u2', '2026-07-16T00:00:00.000Z']);
    expect(res).toEqual({ won: 3, lost: 5 });
  });

  it('returns zeros when nothing closed', async () => {
    select.mockResolvedValueOnce([]);
    expect(await queryMyWinRateSince(['u1'], '2026-01-01')).toEqual({ won: 0, lost: 0 });
  });
});

describe('queryMyPipelineByStage', () => {
  beforeEach(() => select.mockReset());

  it('sums open revenue per stage for the given users', async () => {
    select.mockResolvedValueOnce([
      { stage: 'Qualified', total: 120000, count: 2 },
      { stage: 'Prospecting', total: 30000, count: 1 },
    ]);
    const rows = await queryMyPipelineByStage(['u1']);
    const [sql, params] = select.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("status = 'Open'");
    expect(sql).toContain('GROUP BY stage');
    expect(params).toEqual(['u1']);
    expect(rows).toEqual([
      { stage: 'Qualified', total: 120000, count: 2 },
      { stage: 'Prospecting', total: 30000, count: 1 },
    ]);
  });
});
