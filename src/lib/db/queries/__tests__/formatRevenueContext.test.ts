import { describe, it, expect } from 'vitest';
import { formatRevenueContext } from '../aiSearch';

describe('formatRevenueContext', () => {
  it('shows the as-of value as a plain date, not a raw ISO timestamp', () => {
    const out = formatRevenueContext([
      {
        name: 'Dattico',
        arr: 1000,
        cloud_customer: 1,
        active_end_customers: 5,
        as_of_month: '2026-06-01T00:00:00',
      },
    ]);
    expect(out).toContain('As of: 2026-06-01');
    expect(out).not.toContain('T00:00:00');
  });
});
