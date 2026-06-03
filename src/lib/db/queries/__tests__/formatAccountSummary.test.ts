import { describe, it, expect } from 'vitest';
import { formatAccountSummary, type AccountSummaryStats } from '../aiSearch';

const base: AccountSummaryStats = {
  contactCount: 0,
  oppTotal: 0,
  oppOpen: 0,
  oppOpenValue: 0,
  topOpps: [],
  activityTotal: 0,
  lastActivity: null,
  followUpOpen: 0,
  nextFollowUps: [],
};

describe('formatAccountSummary', () => {
  it('reports counts and open pipeline as a compact summary, not per-record bullets', () => {
    const out = formatAccountSummary({
      ...base,
      contactCount: 14,
      oppTotal: 9,
      oppOpen: 6,
      oppOpenValue: 1234000,
      activityTotal: 23,
      lastActivity: '2026-05-30T10:00:00Z',
      followUpOpen: 4,
    });
    expect(out).toContain('Contacts on record: 14');
    expect(out).toContain(`Opportunities: 9 total, 6 open (€${(1234000).toLocaleString()} open pipeline)`);
    expect(out).toContain('Activities logged: 23, most recent 2026-05-30');
    expect(out).toContain('Open follow-ups: 4');
  });

  it('phrases zero open opportunities clearly', () => {
    const out = formatAccountSummary({ ...base, oppTotal: 3 });
    expect(out).toContain('Opportunities: 3 total, none currently open');
  });

  it('lists only the top opportunities by value as one-liners', () => {
    const out = formatAccountSummary({
      ...base,
      topOpps: [
        { subject: 'Cloud Migration', estimated_revenue: 500000, status: 'Open', stage: 'Propose' },
        { subject: 'Backup Renewal', estimated_revenue: null, status: 'Won', stage: null },
      ],
    });
    expect(out).toContain('Top opportunities by value:');
    expect(out).toContain(`- Cloud Migration — €${(500000).toLocaleString()} (Open · Propose)`);
    expect(out).toContain('- Backup Renewal — value n/a (Won)');
  });

  it('lists the next open follow-ups with due dates', () => {
    const out = formatAccountSummary({
      ...base,
      followUpOpen: 2,
      nextFollowUps: [
        { title: 'Renewal call', due_date: '2026-06-10T00:00:00Z' },
        { title: 'Send quote', due_date: null },
      ],
    });
    expect(out).toContain('Next open follow-ups:');
    expect(out).toContain('- Renewal call (due 2026-06-10)');
    expect(out).toContain('- Send quote');
  });

  it('omits opportunity and follow-up sections when there are none', () => {
    const out = formatAccountSummary({ ...base, contactCount: 2 });
    expect(out).not.toContain('Top opportunities');
    expect(out).not.toContain('Next open follow-ups');
  });
});
