import { describe, it, expect, vi, beforeEach } from 'vitest';

const select = vi.fn();

vi.mock('@/lib/db/client', () => ({
  getDb: vi.fn(async () => ({ select, execute: vi.fn() })),
}));

import { queryMyWinRateSince, queryMyPipelineByStage, queryMyPipeline, queryMyLifetimeArr } from '@/lib/db/queries/analytics';

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

describe('opportunity ARR sums', () => {
  beforeEach(() => select.mockReset());

  it('sums annual revenue (falling back to estimated) for open deals', async () => {
    select.mockResolvedValueOnce([{ openCount: 3, openValue: 450000, weightedForecast: 180000 }]);
    const res = await queryMyPipeline(['u1', 'u2']);
    const [sql, params] = select.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('COALESCE(annual_revenue, estimated_revenue, 0)');
    expect(sql).toContain("status = 'Open'");
    expect(params).toEqual(['u1', 'u2']);
    expect(res).toEqual({ openCount: 3, openValue: 450000, weightedForecast: 180000 });
  });

  it('sums lifetime ARR across every status for the given users', async () => {
    select.mockResolvedValueOnce([{ total: 980000, count: 12 }]);
    const res = await queryMyLifetimeArr(['u1']);
    const [sql, params] = select.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('COALESCE(annual_revenue, estimated_revenue, 0)');
    expect(sql).not.toContain('status');
    expect(params).toEqual(['u1']);
    expect(res).toEqual({ total: 980000, count: 12 });
  });

  it('returns zeros when the user has no opportunities', async () => {
    select.mockResolvedValueOnce([]);
    expect(await queryMyLifetimeArr(['u1'])).toEqual({ total: 0, count: 0 });
  });
});
